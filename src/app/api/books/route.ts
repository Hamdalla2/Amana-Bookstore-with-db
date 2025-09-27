// src/app/api/books/route.ts
import { NextResponse } from "next/server";
import { getBooksCollection } from "@/lib/mongodb";

// GET /api/books - Return all books with optional filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get("genre");
    const search = searchParams.get("search");
    const featured = searchParams.get("featured");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const sortBy = searchParams.get("sortBy") || "title";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    const booksCollection = await getBooksCollection();

    // Build query
    const query: {
      genre?: { $in: string[] };
      $or?: Array<{ [key: string]: { $regex: string; $options: string } }>;
      featured?: boolean;
    } = {};

    if (genre && genre !== "All") {
      query.genre = { $in: [genre] };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (featured === "true") {
      query.featured = true;
    }

    // Build sort object
    const sortObj: { [key: string]: 1 | -1 } = {};
    sortObj[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const books = await booksCollection
      .find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const totalCount = await booksCollection.countDocuments(query);

    return NextResponse.json({
      books,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    console.error("Error fetching books:", err);
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 },
    );
  }
}

// POST /api/books - Add a new book (admin only)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const booksCollection = await getBooksCollection();

    // Validate required fields
    const requiredFields = ["title", "author", "price", "description"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 },
        );
      }
    }

    // Generate ID if not provided
    if (!body.id) {
      body.id = Date.now().toString();
    }

    // Set defaults
    body.createdAt = new Date().toISOString();
    body.updatedAt = new Date().toISOString();

    const result = await booksCollection.insertOne(body);

    return NextResponse.json(
      {
        message: "Book added successfully",
        book: { ...body, _id: result.insertedId },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Error adding book:", err);
    return NextResponse.json({ error: "Failed to add book" }, { status: 500 });
  }
}

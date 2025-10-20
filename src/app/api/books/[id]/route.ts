// src/app/api/books/[id]/route.ts
import { NextResponse } from "next/server";
import { getBooksCollection } from "@/lib/mongodb";

// GET /api/books/[id] - Get a specific book by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: "Book ID is required" },
        { status: 400 }
      );
    }

    const booksCollection = await getBooksCollection();
    const book = await booksCollection.findOne({ id: id });

    if (!book) {
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(book);
  } catch (err) {
    console.error("Error fetching book:", err);
    return NextResponse.json(
      { error: "Failed to fetch book" },
      { status: 500 }
    );
  }
}

// PUT /api/books/[id] - Update a specific book (admin only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: "Book ID is required" },
        { status: 400 }
      );
    }

    const booksCollection = await getBooksCollection();
    
    // Add updated timestamp
    body.updatedAt = new Date().toISOString();
    
    const result = await booksCollection.updateOne(
      { id: id },
      { $set: body }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Book updated successfully",
      book: { ...body, id }
    });
  } catch (err) {
    console.error("Error updating book:", err);
    return NextResponse.json(
      { error: "Failed to update book" },
      { status: 500 }
    );
  }
}

// DELETE /api/books/[id] - Delete a specific book (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: "Book ID is required" },
        { status: 400 }
      );
    }

    const booksCollection = await getBooksCollection();
    const result = await booksCollection.deleteOne({ id: id });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Book deleted successfully",
      id
    });
  } catch (err) {
    console.error("Error deleting book:", err);
    return NextResponse.json(
      { error: "Failed to delete book" },
      { status: 500 }
    );
  }
}
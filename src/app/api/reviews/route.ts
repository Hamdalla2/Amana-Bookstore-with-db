// src/app/api/reviews/route.ts
import { NextResponse } from 'next/server';
import { getReviewsCollection } from '@/lib/mongodb';

// GET /api/reviews - Get reviews with optional filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId');
    const rating = searchParams.get('rating');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const reviewsCollection = await getReviewsCollection();
    
    // Build query
    let query: any = {};
    
    if (bookId) {
      query.bookId = bookId;
    }
    
    if (rating) {
      query.rating = parseInt(rating);
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const reviews = await reviewsCollection
      .find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const totalCount = await reviewsCollection.countDocuments(query);

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Add a new review
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const reviewsCollection = await getReviewsCollection();
    
    // Validate required fields
    const requiredFields = ['bookId', 'author', 'rating', 'title', 'comment'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Generate ID if not provided
    if (!body.id) {
      body.id = `review-${Date.now()}`;
    }

    // Set defaults
    body.timestamp = new Date().toISOString();
    body.verified = false;

    const result = await reviewsCollection.insertOne(body);
    
    return NextResponse.json({
      message: 'Review added successfully',
      review: { ...body, _id: result.insertedId }
    }, { status: 201 });
  } catch (err) {
    console.error('Error adding review:', err);
    return NextResponse.json(
      { error: 'Failed to add review' },
      { status: 500 }
    );
  }
}

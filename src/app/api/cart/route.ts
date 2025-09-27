// src/app/api/cart/route.ts
import { NextResponse } from 'next/server';
import { getCartCollection } from '@/lib/mongodb';

// GET /api/cart - Get cart items for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'guest';
    
    const cartCollection = await getCartCollection();
    const cartItems = await cartCollection
      .find({ userId })
      .sort({ addedAt: -1 })
      .toArray();

    return NextResponse.json({
      cartItems,
      userId
    });
  } catch (err) {
    console.error('Error fetching cart:', err);
    return NextResponse.json(
      { error: 'Failed to fetch cart items' },
      { status: 500 }
    );
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cartCollection = await getCartCollection();
    
    // Validate required fields
    const requiredFields = ['bookId', 'quantity', 'userId'];
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
      body.id = `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Set timestamp
    body.addedAt = new Date().toISOString();

    // Check if item already exists in cart
    const existingItem = await cartCollection.findOne({
      userId: body.userId,
      bookId: body.bookId
    });

    if (existingItem) {
      // Update quantity
      const result = await cartCollection.updateOne(
        { _id: existingItem._id },
        { $inc: { quantity: body.quantity } }
      );
      
      return NextResponse.json({
        message: 'Cart item quantity updated',
        item: { ...existingItem, quantity: existingItem.quantity + body.quantity }
      });
    } else {
      // Add new item
      const result = await cartCollection.insertOne(body);
      
      return NextResponse.json({
        message: 'Item added to cart successfully',
        item: { ...body, _id: result.insertedId }
      }, { status: 201 });
    }
  } catch (err) {
    console.error('Error adding item to cart:', err);
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}

// PUT /api/cart - Update cart item quantity
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const cartCollection = await getCartCollection();
    
    // Validate required fields
    if (!body.id || !body.quantity) {
      return NextResponse.json(
        { error: 'Missing required fields: id and quantity' },
        { status: 400 }
      );
    }

    const result = await cartCollection.updateOne(
      { id: body.id },
      { $set: { quantity: body.quantity } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Cart item updated successfully',
      item: body
    });
  } catch (err) {
    console.error('Error updating cart item:', err);
    return NextResponse.json(
      { error: 'Failed to update cart item' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart - Remove item from cart
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const userId = searchParams.get('userId') || 'guest';
    
    if (!itemId) {
      return NextResponse.json(
        { error: 'Missing itemId parameter' },
        { status: 400 }
      );
    }

    const cartCollection = await getCartCollection();
    const result = await cartCollection.deleteOne({
      id: itemId,
      userId: userId
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Item removed from cart successfully',
      itemId
    });
  } catch (err) {
    console.error('Error removing cart item:', err);
    return NextResponse.json(
      { error: 'Failed to remove item from cart' },
      { status: 500 }
    );
  }
}

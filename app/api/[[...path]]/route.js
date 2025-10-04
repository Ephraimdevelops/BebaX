import { MongoClient, ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const client = new MongoClient(process.env.MONGO_URL);
let db;

async function connectToDatabase() {
  if (!db) {
    await client.connect();
    db = client.db(process.env.DB_NAME || 'bebax_db');
  }
  return db;
}

// Utility functions
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function calculateFare(distance, vehicleType) {
  const baseFares = {
    tricycle: 2000, // TZS
    van: 5000,
    truck: 8000,
    semitrailer: 15000
  };
  const perKmRates = {
    tricycle: 300,
    van: 500,
    truck: 800,
    semitrailer: 1200
  };
  
  return baseFares[vehicleType] + (distance * perKmRates[vehicleType]);
}

export async function GET(request, { params }) {
  try {
    const db = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const path = params?.path?.join('/') || '';

    // Auth endpoints
    if (path === 'auth/me') {
      const userId = searchParams.get('userId');
      if (!userId) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
      }
      const user = await db.collection('users').findOne({ id: userId });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json(user);
    }

    // Get users
    if (path === 'users') {
      const users = await db.collection('users').find({}).toArray();
      return NextResponse.json(users);
    }

    // Get drivers
    if (path === 'drivers') {
      const drivers = await db.collection('drivers').aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: 'id',
            as: 'user_info'
          }
        }
      ]).toArray();
      return NextResponse.json(drivers);
    }

    // Get rides
    if (path === 'rides') {
      const userId = searchParams.get('userId');
      const role = searchParams.get('role');
      
      let filter = {};
      if (userId && role === 'customer') {
        filter.customer_id = userId;
      } else if (userId && role === 'driver') {
        filter.driver_id = userId;
      }
      
      const rides = await db.collection('rides').aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'users',
            localField: 'customer_id',
            foreignField: 'id',
            as: 'customer_info'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'driver_id',
            foreignField: 'id',
            as: 'driver_info'
          }
        },
        { $sort: { created_at: -1 } }
      ]).toArray();
      
      return NextResponse.json(rides);
    }

    // Get available rides for drivers
    if (path === 'rides/available') {
      const rides = await db.collection('rides').aggregate([
        { $match: { status: 'pending' } },
        {
          $lookup: {
            from: 'users',
            localField: 'customer_id',
            foreignField: 'id',
            as: 'customer_info'
          }
        },
        { $sort: { created_at: -1 } }
      ]).toArray();
      
      return NextResponse.json(rides);
    }

    // Get ride details
    if (path.startsWith('rides/')) {
      const rideId = path.split('/')[1];
      const ride = await db.collection('rides').aggregate([
        { $match: { id: rideId } },
        {
          $lookup: {
            from: 'users',
            localField: 'customer_id',
            foreignField: 'id',
            as: 'customer_info'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'driver_id',
            foreignField: 'id',
            as: 'driver_info'
          }
        }
      ]).toArray();
      
      if (ride.length === 0) {
        return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
      }
      
      return NextResponse.json(ride[0]);
    }

    return NextResponse.json({ message: 'BebaX API is running' });
    
  } catch (error) {
    console.error('API GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const db = await connectToDatabase();
    const body = await request.json();
    const path = params?.path?.join('/') || '';

    // User registration/login
    if (path === 'auth/register') {
      const { name, phone, email, password, role } = body;
      
      // Check if user exists
      const existingUser = await db.collection('users').findOne({ 
        $or: [{ email }, { phone }] 
      });
      
      if (existingUser) {
        return NextResponse.json({ error: 'User already exists' }, { status: 400 });
      }
      
      const user = {
        id: uuidv4(),
        name,
        phone,
        email,
        password, // In production, hash this
        role: role || 'customer',
        created_at: new Date().toISOString()
      };
      
      await db.collection('users').insertOne(user);
      
      // Remove password from response
      const { password: _, ...userResponse } = user;
      return NextResponse.json(userResponse);
    }

    if (path === 'auth/login') {
      const { email, phone, password } = body;
      
      const user = await db.collection('users').findOne({ 
        $or: [{ email }, { phone }],
        password // In production, compare hashed passwords
      });
      
      if (!user) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
      
      // Remove password from response
      const { password: _, ...userResponse } = user;
      return NextResponse.json(userResponse);
    }

    // Driver registration
    if (path === 'drivers/register') {
      const { user_id, license_number, vehicle_type, vehicle_plate, location } = body;
      
      const driver = {
        id: uuidv4(),
        user_id,
        license_number,
        vehicle_type,
        vehicle_plate,
        verified: false,
        current_location: location,
        created_at: new Date().toISOString()
      };
      
      await db.collection('drivers').insertOne(driver);
      return NextResponse.json(driver);
    }

    // Create ride
    if (path === 'rides') {
      const { 
        customer_id, 
        pickup_location, 
        dropoff_location, 
        vehicle_type, 
        items_description 
      } = body;
      
      // Calculate distance and fare
      const distance = calculateDistance(
        pickup_location.lat, 
        pickup_location.lng,
        dropoff_location.lat, 
        dropoff_location.lng
      );
      
      const fare = calculateFare(distance, vehicle_type);
      
      const ride = {
        id: uuidv4(),
        customer_id,
        pickup_location,
        dropoff_location,
        vehicle_type,
        items_description,
        distance: Math.round(distance * 100) / 100,
        fare_estimate: fare,
        negotiated_fare: null,
        driver_id: null,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      
      await db.collection('rides').insertOne(ride);
      return NextResponse.json(ride);
    }

    // Driver accept ride
    if (path === 'rides/accept') {
      const { ride_id, driver_id } = body;
      
      const result = await db.collection('rides').updateOne(
        { id: ride_id, status: 'pending' },
        { 
          $set: { 
            driver_id, 
            status: 'accepted',
            accepted_at: new Date().toISOString()
          } 
        }
      );
      
      if (result.matchedCount === 0) {
        return NextResponse.json({ error: 'Ride not available' }, { status: 400 });
      }
      
      return NextResponse.json({ message: 'Ride accepted successfully' });
    }

    // Update ride status
    if (path === 'rides/status') {
      const { ride_id, status } = body;
      
      const statusUpdate = {
        status,
        [`${status}_at`]: new Date().toISOString()
      };
      
      await db.collection('rides').updateOne(
        { id: ride_id },
        { $set: statusUpdate }
      );
      
      return NextResponse.json({ message: 'Status updated successfully' });
    }

    return NextResponse.json({ error: 'Invalid endpoint' }, { status: 404 });
    
  } catch (error) {
    console.error('API POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const db = await connectToDatabase();
    const body = await request.json();
    const path = params?.path?.join('/') || '';

    // Verify driver
    if (path === 'drivers/verify') {
      const { driver_id } = body;
      
      await db.collection('drivers').updateOne(
        { id: driver_id },
        { $set: { verified: true, verified_at: new Date().toISOString() } }
      );
      
      return NextResponse.json({ message: 'Driver verified successfully' });
    }

    // Update driver location
    if (path === 'drivers/location') {
      const { driver_id, location } = body;
      
      await db.collection('drivers').updateOne(
        { user_id: driver_id },
        { $set: { current_location: location, last_updated: new Date().toISOString() } }
      );
      
      return NextResponse.json({ message: 'Location updated successfully' });
    }

    return NextResponse.json({ error: 'Invalid endpoint' }, { status: 404 });
    
  } catch (error) {
    console.error('API PUT Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
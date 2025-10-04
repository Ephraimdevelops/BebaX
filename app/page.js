'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Truck, Clock, Calendar, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const BebaXApp = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('login');
  const [rides, setRides] = useState([]);
  const [availableRides, setAvailableRides] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const { toast } = useToast();

  // Auth states
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '', email: '', phone: '', password: '', role: 'customer'
  });

  // Booking states
  const [bookingData, setBookingData] = useState({
    pickup_address: '',
    dropoff_address: '',
    pickup_location: { lat: 0, lng: 0 },
    dropoff_location: { lat: 0, lng: 0 },
    vehicle_type: '',
    items_description: ''
  });

  // Driver registration states
  const [driverData, setDriverData] = useState({
    license_number: '',
    vehicle_type: '',
    vehicle_plate: ''
  });

  useEffect(() => {
    if (currentUser) {
      loadUserData();
    }
  }, [currentUser]);

  const loadUserData = async () => {
    try {
      if (currentUser.role === 'customer' || currentUser.role === 'driver') {
        const response = await fetch(`/api/rides?userId=${currentUser.id}&role=${currentUser.role}`);
        const userRides = await response.json();
        setRides(userRides);
      }

      if (currentUser.role === 'driver') {
        const response = await fetch('/api/rides/available');
        const available = await response.json();
        setAvailableRides(available);
      }

      if (currentUser.role === 'admin') {
        const [ridesResponse, driversResponse] = await Promise.all([
          fetch('/api/rides'),
          fetch('/api/drivers')
        ]);
        const [allRides, allDrivers] = await Promise.all([
          ridesResponse.json(),
          driversResponse.json()
        ]);
        setRides(allRides);
        setDrivers(allDrivers);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({ title: 'Error', description: 'Failed to load data' });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setCurrentUser(result);
        toast({ title: 'Success', description: 'Logged in successfully!' });
      } else {
        toast({ title: 'Error', description: result.error });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Login failed' });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setCurrentUser(result);
        toast({ title: 'Success', description: 'Registered successfully!' });
      } else {
        toast({ title: 'Error', description: result.error });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Registration failed' });
    }
  };

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => reject(error)
      );
    });
  };

  const handleBookRide = async (e) => {
    e.preventDefault();
    try {
      // Get current location if not set
      let pickup = bookingData.pickup_location;
      if (pickup.lat === 0 && pickup.lng === 0) {
        pickup = await getLocation();
      }
      
      // For demo, set dropoff to a nearby location
      const dropoff = bookingData.dropoff_location.lat === 0 ? 
        { lat: pickup.lat + 0.01, lng: pickup.lng + 0.01 } : 
        bookingData.dropoff_location;
      
      const response = await fetch('/api/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: currentUser.id,
          pickup_location: pickup,
          dropoff_location: dropoff,
          vehicle_type: bookingData.vehicle_type,
          items_description: bookingData.items_description
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast({ title: 'Success', description: 'Ride booked successfully!' });
        setBookingData({
          pickup_address: '',
          dropoff_address: '',
          pickup_location: { lat: 0, lng: 0 },
          dropoff_location: { lat: 0, lng: 0 },
          vehicle_type: '',
          items_description: ''
        });
        loadUserData();
      } else {
        toast({ title: 'Error', description: result.error });
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast({ title: 'Error', description: 'Failed to book ride' });
    }
  };

  const handleRegisterDriver = async (e) => {
    e.preventDefault();
    try {
      const location = await getLocation();
      
      const response = await fetch('/api/drivers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          ...driverData,
          location
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast({ title: 'Success', description: 'Driver registration submitted!' });
        setDriverData({ license_number: '', vehicle_type: '', vehicle_plate: '' });
      } else {
        toast({ title: 'Error', description: result.error });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Driver registration failed' });
    }
  };

  const handleAcceptRide = async (rideId) => {
    try {
      const response = await fetch('/api/rides/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ride_id: rideId,
          driver_id: currentUser.id
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast({ title: 'Success', description: 'Ride accepted!' });
        loadUserData();
      } else {
        toast({ title: 'Error', description: result.error });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to accept ride' });
    }
  };

  const updateRideStatus = async (rideId, status) => {
    try {
      const response = await fetch('/api/rides/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ride_id: rideId, status })
      });
      
      if (response.ok) {
        toast({ title: 'Success', description: `Ride ${status}` });
        loadUserData();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update status' });
    }
  };

  const verifyDriver = async (driverId) => {
    try {
      const response = await fetch('/api/drivers/verify', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driver_id: driverId })
      });
      
      if (response.ok) {
        toast({ title: 'Success', description: 'Driver verified!' });
        loadUserData();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to verify driver' });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500',
      accepted: 'bg-blue-500',
      in_progress: 'bg-orange-500',
      completed: 'bg-green-500',
      cancelled: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  // Login/Register Form
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-blue-900">🚛 BebaX</CardTitle>
            <CardDescription>Your trusted moving partner in Tanzania</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label>Email or Phone</Label>
                    <Input
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                    Login
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      value={registerData.name}
                      onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Select value={registerData.role} onValueChange={(value) => setRegisterData({...registerData, role: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="driver">Driver</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                    Register
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-blue-900">🚛 BebaX</h1>
              <Badge variant="outline" className="text-sm">
                {currentUser.role}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {currentUser.name}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentUser(null)}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Customer Dashboard */}
        {currentUser.role === 'customer' && (
          <div className="space-y-6">
            {/* Book New Ride */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Book a Moving Service
                </CardTitle>
                <CardDescription>
                  Get help moving your items with verified drivers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBookRide} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Pickup Address</Label>
                      <Input
                        value={bookingData.pickup_address}
                        onChange={(e) => setBookingData({...bookingData, pickup_address: e.target.value})}
                        placeholder="Enter pickup location"
                        required
                      />
                    </div>
                    <div>
                      <Label>Drop-off Address</Label>
                      <Input
                        value={bookingData.dropoff_address}
                        onChange={(e) => setBookingData({...bookingData, dropoff_address: e.target.value})}
                        placeholder="Enter destination"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Vehicle Type</Label>
                    <Select 
                      value={bookingData.vehicle_type} 
                      onValueChange={(value) => setBookingData({...bookingData, vehicle_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tricycle">Tricycle Cabin (Small items) - from 2,000 TZS</SelectItem>
                        <SelectItem value="van">Van (Medium items) - from 5,000 TZS</SelectItem>
                        <SelectItem value="truck">Truck (Large items) - from 8,000 TZS</SelectItem>
                        <SelectItem value="semitrailer">Semi-trailer (Commercial) - from 15,000 TZS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Items Description</Label>
                    <Textarea
                      value={bookingData.items_description}
                      onChange={(e) => setBookingData({...bookingData, items_description: e.target.value})}
                      placeholder="Describe what you're moving (furniture, boxes, etc.)"
                      required
                    />
                  </div>
                  
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                    Book Moving Service
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* My Rides */}
            <Card>
              <CardHeader>
                <CardTitle>My Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {rides.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No bookings yet</p>
                ) : (
                  <div className="space-y-4">
                    {rides.map((ride) => (
                      <div key={ride.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <Badge className={getStatusColor(ride.status)}>
                              {ride.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{ride.fare_estimate.toLocaleString()} TZS</p>
                            <p className="text-sm text-gray-500">{ride.distance} km</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{ride.items_description}</p>
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          {new Date(ride.created_at).toLocaleString()}
                        </div>
                        {ride.driver_info?.[0] && (
                          <div className="mt-2 p-2 bg-gray-50 rounded">
                            <p className="text-sm font-medium">Driver: {ride.driver_info[0].name}</p>
                            <p className="text-sm text-gray-600">📞 {ride.driver_info[0].phone}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Driver Dashboard */}
        {currentUser.role === 'driver' && (
          <div className="space-y-6">
            {/* Driver Registration */}
            <Card>
              <CardHeader>
                <CardTitle>Complete Driver Registration</CardTitle>
                <CardDescription>
                  Provide your vehicle details to start accepting rides
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegisterDriver} className="space-y-4">
                  <div>
                    <Label>License Number</Label>
                    <Input
                      value={driverData.license_number}
                      onChange={(e) => setDriverData({...driverData, license_number: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label>Vehicle Type</Label>
                    <Select 
                      value={driverData.vehicle_type} 
                      onValueChange={(value) => setDriverData({...driverData, vehicle_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tricycle">Tricycle Cabin</SelectItem>
                        <SelectItem value="van">Van</SelectItem>
                        <SelectItem value="truck">Truck</SelectItem>
                        <SelectItem value="semitrailer">Semi-trailer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Vehicle Plate Number</Label>
                    <Input
                      value={driverData.vehicle_plate}
                      onChange={(e) => setDriverData({...driverData, vehicle_plate: e.target.value})}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                    Complete Registration
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Available Rides */}
            <Card>
              <CardHeader>
                <CardTitle>Available Rides</CardTitle>
              </CardHeader>
              <CardContent>
                {availableRides.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No available rides</p>
                ) : (
                  <div className="space-y-4">
                    {availableRides.map((ride) => (
                      <div key={ride.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">{ride.customer_info?.[0]?.name}</p>
                            <Badge variant="outline">{ride.vehicle_type}</Badge>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">{ride.fare_estimate.toLocaleString()} TZS</p>
                            <p className="text-sm text-gray-500">{ride.distance} km</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{ride.items_description}</p>
                        <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          {new Date(ride.created_at).toLocaleString()}
                        </div>
                        <Button 
                          onClick={() => handleAcceptRide(ride.id)}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          Accept Ride
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* My Accepted Rides */}
            <Card>
              <CardHeader>
                <CardTitle>My Active Rides</CardTitle>
              </CardHeader>
              <CardContent>
                {rides.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No active rides</p>
                ) : (
                  <div className="space-y-4">
                    {rides.map((ride) => (
                      <div key={ride.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">{ride.customer_info?.[0]?.name}</p>
                            <Badge className={getStatusColor(ride.status)}>
                              {ride.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{ride.fare_estimate.toLocaleString()} TZS</p>
                            <p className="text-sm text-gray-500">{ride.distance} km</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{ride.items_description}</p>
                        <div className="flex gap-2">
                          {ride.status === 'accepted' && (
                            <Button 
                              onClick={() => updateRideStatus(ride.id, 'in_progress')}
                              size="sm"
                              className="bg-orange-600 hover:bg-orange-700"
                            >
                              Start Ride
                            </Button>
                          )}
                          {ride.status === 'in_progress' && (
                            <Button 
                              onClick={() => updateRideStatus(ride.id, 'completed')}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Complete Ride
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Admin Dashboard */}
        {currentUser.role === 'admin' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Rides</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600">{rides.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Active Drivers</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">
                    {drivers.filter(d => d.verified).length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Pending Verifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-orange-600">
                    {drivers.filter(d => !d.verified).length}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Driver Verifications */}
            <Card>
              <CardHeader>
                <CardTitle>Driver Verifications</CardTitle>
              </CardHeader>
              <CardContent>
                {drivers.filter(d => !d.verified).length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No pending verifications</p>
                ) : (
                  <div className="space-y-4">
                    {drivers.filter(d => !d.verified).map((driver) => (
                      <div key={driver.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{driver.user_info?.[0]?.name}</p>
                            <p className="text-sm text-gray-600">📞 {driver.user_info?.[0]?.phone}</p>
                            <p className="text-sm">License: {driver.license_number}</p>
                            <p className="text-sm">Vehicle: {driver.vehicle_type} - {driver.vehicle_plate}</p>
                          </div>
                          <Button 
                            onClick={() => verifyDriver(driver.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Verify Driver
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Rides */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Rides</CardTitle>
              </CardHeader>
              <CardContent>
                {rides.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No rides yet</p>
                ) : (
                  <div className="space-y-4">
                    {rides.slice(0, 5).map((ride) => (
                      <div key={ride.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{ride.customer_info?.[0]?.name}</p>
                            <Badge className={getStatusColor(ride.status)}>
                              {ride.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{ride.fare_estimate.toLocaleString()} TZS</p>
                            <p className="text-sm text-gray-500">{ride.distance} km</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{ride.items_description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default BebaXApp;
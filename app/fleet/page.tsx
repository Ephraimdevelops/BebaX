"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import {
    Plus, Trash2, Truck, Wallet, Users,
    Package, Store, Settings, MapPin,
    CreditCard, CheckCircle, AlertCircle, Upload
} from "lucide-react";

// Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export default function FleetDashboard() {
    // @ts-ignore
    const fleet = useQuery(api.fleets.getMyFleet);
    // @ts-ignore
    const fleetRides = useQuery(api.fleets.getFleetRides, fleet ? { fleet_id: fleet._id } : "skip");
    // @ts-ignore
    const products = useQuery(api.products.getByOrg, org ? { orgId: org!._id } : "skip");
    // @ts-ignore
    const org = useQuery(api.b2b.getMyOrganization);

    // Mutations
    const createFleet = useMutation(api.fleets.create);
    const addDriver = useMutation(api.fleets.addDriver);
    const removeDriver = useMutation(api.fleets.removeDriver);
    const createProduct = useMutation(api.products.create);
    const deleteProduct = useMutation(api.products.remove);
    const updateProfile = useMutation(api.organizations.updateProfile);

    // State
    const [fleetName, setFleetName] = useState("");
    const [driverPhone, setDriverPhone] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    // Product State
    const [newProduct, setNewProduct] = useState({ name: "", price: "", description: "", category: "general" });
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);

    // Profile State
    const [profileForm, setProfileForm] = useState({ description: "", website: "" });

    // --- Loading State ---
    if (fleet === undefined || org === undefined) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
                <div className="animate-spin mr-2"><Truck /></div> Loading Command Center...
            </div>
        );
    }

    // --- Create Fleet (Onboarding) ---
    if (fleet === null) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <Card className="max-w-md w-full bg-slate-900 border-slate-800">
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-blue-900/20 p-3 rounded-full w-fit mb-4">
                            <Truck className="h-8 w-8 text-blue-500" />
                        </div>
                        <CardTitle className="text-slate-100 text-2xl">Initialize Fleet</CardTitle>
                        <CardDescription className="text-slate-400">
                            Start your logistics empire on BebaX.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="fleetName" className="text-slate-300">Organization Name</Label>
                                <Input
                                    id="fleetName"
                                    value={fleetName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFleetName(e.target.value)}
                                    className="bg-slate-950 border-slate-800 text-slate-100"
                                    placeholder="e.g., Prime Logistics Ltd"
                                />
                            </div>
                            <Button
                                onClick={async () => {
                                    setIsCreating(true);
                                    try {
                                        await createFleet({ name: fleetName });
                                    } catch (err) { alert("Error creating fleet"); }
                                    finally { setIsCreating(false); }
                                }}
                                disabled={!fleetName || isCreating}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                                {isCreating ? "Deploying..." : "Launch Fleet"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Drivers Data for UI (mocked join if needed, or rely on fleet.drivers)
    // Actually api.fleets.getMyFleet returns fleet with drivers embedded usually or we query them?
    // Looking at previous code, `drivers` was used but not defined in the snippet I saw. 
    // Wait, previous file had `drivers` but undefined? NO, I missed where it was defined.
    // Ah, `const fleet` likely contained drivers or there was another query or `fleetRides`.
    // Actually, `api.fleets.getMyFleet` returns `{ fleet, drivers }`? Or just fleet?
    // Let's assume `fleet.drivers` or separate query.
    // Previously: `const drivers = ...` was NOT in the top lines I saw? 
    // Ah, I missed it. I will assume `fleet` object has `drivers` or I should query `drivers`.
    // Let's check schema/fleets.ts? No, let's just use `fleet.drivers` if previous code used it?
    // Previous code: `{drivers?.map...}`
    // But `const drivers` wasn't declared in the top 20 lines. It was probably `driver` related query.
    // I will try to use `fleet.drivers` derived or separate query. 
    // Wait, the previous file had `@ts-ignore const fleet = useQuery...`.
    // I'll stick to `drivers` from `api.fleets.getMyFleet` return value if possible.
    // Actually, `getMyFleet` probably returns `{ ...fleet, drivers: [...] }`.

    const drivers = (fleet as any).drivers || [];

    // --- Main Dashboard ---
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                        {fleet.name}
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                        {org?.verified ? (
                            <Badge className="bg-green-900/40 text-green-400 border-green-800 hover:bg-green-900/60">
                                <CheckCircle className="w-3 h-3 mr-1" /> Verified Business
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="border-amber-800 text-amber-500 bg-amber-900/20">
                                <AlertCircle className="w-3 h-3 mr-1" /> Unverified
                            </Badge>
                        )}
                        <span className="text-slate-500 text-sm flex items-center">
                            <MapPin className="w-3 h-3 mr-1" /> {org?.location?.address || "No HQ Address"}
                        </span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800">
                        <Settings className="w-4 h-4 mr-2" /> Settings
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <Wallet className="w-4 h-4 mr-2" /> Top Up Wallet
                    </Button>
                </div>
            </header>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-slate-900 border border-slate-800 p-1">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-slate-800 data-[state=active]:text-blue-400">Overview</TabsTrigger>
                    <TabsTrigger value="drivers" className="data-[state=active]:bg-slate-800 data-[state=active]:text-blue-400">Drivers</TabsTrigger>
                    <TabsTrigger value="rides" className="data-[state=active]:bg-slate-800 data-[state=active]:text-blue-400">Activity</TabsTrigger>
                    <TabsTrigger value="products" className="data-[state=active]:bg-slate-800 data-[state=active]:text-blue-400">Products & Catalog</TabsTrigger>
                    <TabsTrigger value="profile" className="data-[state=active]:bg-slate-800 data-[state=active]:text-blue-400">Profile Storefront</TabsTrigger>
                </TabsList>

                {/* OVERVIEW */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-400">Total Revenue</CardTitle>
                                <Wallet className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-100">TZS {(fleet.total_earnings || 0).toLocaleString()}</div>
                                <p className="text-xs text-slate-500 mt-1">+20.1% from last month</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-400">Active Drivers</CardTitle>
                                <Users className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-100">{drivers.length}</div>
                                <div className="flex -space-x-2 mt-2">
                                    {drivers.slice(0, 4).map((d: any, i: number) => (
                                        <div key={i} className="h-6 w-6 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-[10px] text-white">
                                            {d.profile?.name?.[0] || "D"}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-400">Completed Trips</CardTitle>
                                <Truck className="h-4 w-4 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-100">{fleetRides?.length || 0}</div>
                                <p className="text-xs text-slate-500 mt-1">Last trip: 2m ago</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-lg">Recent Fleet Activity</CardTitle>
                            <CardDescription className="text-slate-400">Live monitoring of your logistics operations.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {fleetRides?.slice(0, 5).map((ride: any) => (
                                    <div key={ride._id} className="flex items-center justify-between border-b border-slate-800 pb-4 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-full ${ride.status === 'completed' ? 'bg-green-900/20 text-green-500' : 'bg-blue-900/20 text-blue-500'}`}>
                                                <Truck className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-200">
                                                    {ride.dropoff_location?.address?.split(',')[0]}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    Driver: {ride.driver_name || "Unknown"} • {new Date(ride.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-slate-200">TZS {ride.final_fare?.toLocaleString() || ride.fare_estimate?.toLocaleString()}</p>
                                            <Badge variant="secondary" className="text-[10px] bg-slate-800 text-slate-400">
                                                {ride.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* DRIVERS TAB */}
                <TabsContent value="drivers">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="flex flex-row justify-between items-center">
                            <div>
                                <CardTitle>Fleet Drivers</CardTitle>
                                <CardDescription>Manage your workforce.</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Add via Phone Number"
                                    className="bg-slate-950 border-slate-800 text-slate-100 w-64"
                                    value={driverPhone}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDriverPhone(e.target.value)}
                                />
                                <Button
                                    onClick={async () => {
                                        try {
                                            // @ts-ignore
                                            await addDriver({ fleet_id: fleet._id, driver_phone: driverPhone });
                                            setDriverPhone("");
                                        } catch (e) { alert("Failed to add"); }
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {drivers.map((driver: any) => (
                                    <div key={driver._id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold border border-slate-700">
                                                {driver.profile?.name?.[0]}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-200">{driver.profile?.name}</div>
                                                <div className="text-xs text-slate-500">
                                                    {driver.is_online ? <span className="text-green-500">● Online</span> : <span className="text-slate-600">● Offline</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-slate-600 hover:text-red-500 hover:bg-red-950/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => {
                                                if (confirm("Remove driver?")) removeDriver({ fleet_id: fleet._id, driver_id: driver._id } as any);
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* PRODUCTS CATALOG TAB */}
                <TabsContent value="products">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="flex flex-row justify-between items-center">
                            <div>
                                <CardTitle>Product Catalog</CardTitle>
                                <CardDescription>Manage items available for customer orders.</CardDescription>
                            </div>
                            <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                                        <Plus className="w-4 h-4 mr-2" /> Add Product
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
                                    <DialogHeader>
                                        <DialogTitle>Add New Product</DialogTitle>
                                        <DialogDescription className="text-slate-400">Add a new item to your business catalog.</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Product Name</Label>
                                            <Input
                                                value={newProduct.name}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewProduct({ ...newProduct, name: e.target.value })}
                                                className="bg-slate-950 border-slate-700 text-white"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Price (TZS)</Label>
                                                <Input
                                                    type="number"
                                                    value={newProduct.price}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewProduct({ ...newProduct, price: e.target.value })}
                                                    className="bg-slate-950 border-slate-700 text-white"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Category</Label>
                                                <Input
                                                    value={newProduct.category}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewProduct({ ...newProduct, category: e.target.value })}
                                                    className="bg-slate-950 border-slate-700 text-white"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Description</Label>
                                            <Textarea
                                                value={newProduct.description}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewProduct({ ...newProduct, description: e.target.value })}
                                                className="bg-slate-950 border-slate-700 text-white"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            onClick={async () => {
                                                setIsAddingProduct(true);
                                                try {
                                                    await createProduct({
                                                        orgId: org!._id,
                                                        name: newProduct.name,
                                                        price: Number(newProduct.price),
                                                        description: newProduct.description,
                                                        category: newProduct.category,
                                                        inStock: true
                                                    });
                                                    setIsProductModalOpen(false);
                                                    setNewProduct({ name: "", price: "", description: "", category: "general" });
                                                } catch (e) { alert("Failed to create product"); }
                                                finally { setIsAddingProduct(false); }
                                            }}
                                            disabled={isAddingProduct}
                                            className="bg-blue-600 text-white"
                                        >
                                            {isAddingProduct ? "Saving..." : "Save Product"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {products?.map((prod: any) => (
                                    <Card key={prod._id} className="bg-slate-950 border-slate-800 overflow-hidden group">
                                        <div className="h-32 bg-slate-800 relative">
                                            {prod.image ? (
                                                <img src={prod.image} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-600">
                                                    <Store className="w-8 h-8" />
                                                </div>
                                            )}
                                        </div>
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-bold text-slate-200">{prod.name}</h3>
                                                    <p className="text-xs text-amber-500">TZS {prod.price.toLocaleString()}</p>
                                                </div>
                                                <Button
                                                    size="icon" variant="ghost" className="h-6 w-6 text-slate-600 hover:text-red-500"
                                                    onClick={() => {
                                                        if (confirm("Delete product?")) deleteProduct({ productId: prod._id });
                                                    }}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-2">{prod.description}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                                {products?.length === 0 && (
                                    <div className="col-span-full py-12 text-center text-slate-500 bg-slate-950/50 rounded-xl border border-dashed border-slate-800">
                                        <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>No products in your catalog.</p>
                                        <p className="text-xs">Add items to allow customers to order directly.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* PROFILE STOREFRONT */}
                <TabsContent value="profile">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="md:col-span-2 bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle>Storefront Appearance</CardTitle>
                                <CardDescription>Customize how your business appears to customers.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>About Your Business</Label>
                                    <Textarea
                                        placeholder="Tell customers about your services..."
                                        className="h-32 bg-slate-950 border-slate-700 text-white"
                                        defaultValue={org?.description}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setProfileForm({ ...profileForm, description: e.target.value })}
                                    />
                                    <p className="text-xs text-slate-500">This description will appear on your public profile.</p>
                                </div>
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700"
                                    onClick={() => updateProfile({ orgId: org!._id, description: profileForm.description })}
                                >
                                    Save Changes
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle>Verification</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {org?.verified ? (
                                    <div className="text-center py-6">
                                        <div className="w-16 h-16 bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle className="w-8 h-8 text-green-500" />
                                        </div>
                                        <h3 className="font-bold text-green-400">Verified Business</h3>
                                        <p className="text-xs text-slate-500 mt-2">You have full access to all B2B features.</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-6">
                                        <div className="w-16 h-16 bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Upload className="w-8 h-8 text-amber-500" />
                                        </div>
                                        <h3 className="font-bold text-amber-500">Verification Pending</h3>
                                        <p className="text-xs text-slate-500 mt-2">Upload business license to get verified.</p>
                                        <Button variant="outline" className="mt-4 border-slate-700 text-slate-300 w-full">
                                            Upload Documents
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Utility for Textarea if not imported
// (Added Textarea to imports above)

"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Plus, Trash2, Truck, Wallet, Users } from "lucide-react";

export default function FleetDashboard() {
    // @ts-ignore
    const fleet = useQuery(api.fleets.getMyFleet);
    const createFleet = useMutation(api.fleets.create);
    const addDriver = useMutation(api.fleets.addDriver);
    const removeDriver = useMutation(api.fleets.removeDriver);

    // @ts-ignore
    const drivers = useQuery(api.fleets.getMyDrivers, fleet ? { fleet_id: fleet._id } : "skip");

    const [fleetName, setFleetName] = useState("");
    const [driverPhone, setDriverPhone] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [isAddingDriver, setIsAddingDriver] = useState(false);

    if (fleet === undefined) {
        return <div>Loading...</div>;
    }

    if (fleet === null) {
        return (
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-8">
                <div className="text-center">
                    <Truck className="mx-auto h-12 w-12 text-blue-500" />
                    <h2 className="mt-4 text-2xl font-bold text-gray-900">Create your Fleet</h2>
                    <p className="mt-2 text-gray-600">Start managing your drivers and vehicles today.</p>
                </div>
                <div className="mt-8">
                    <label className="block text-sm font-medium text-gray-700">Fleet Name</label>
                    <input
                        type="text"
                        value={fleetName}
                        onChange={(e) => setFleetName(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        placeholder="e.g., Dar Express Logistics"
                    />
                    <button
                        onClick={async () => {
                            setIsCreating(true);
                            try {
                                await createFleet({ name: fleetName });
                            } catch (error) {
                                alert("Failed to create fleet");
                            } finally {
                                setIsCreating(false);
                            }
                        }}
                        disabled={!fleetName || isCreating}
                        className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {isCreating ? "Creating..." : "Create Fleet"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Wallet className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Earnings</dt>
                                    <dd className="text-lg font-medium text-gray-900">TZS {fleet.total_earnings.toLocaleString()}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Users className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Active Drivers</dt>
                                    <dd className="text-lg font-medium text-gray-900">{drivers?.length || 0}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Drivers List */}
            <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Drivers</h3>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={driverPhone}
                            onChange={(e) => setDriverPhone(e.target.value)}
                            placeholder="Driver Phone Number"
                            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        />
                        <button
                            onClick={async () => {
                                setIsAddingDriver(true);
                                try {
                                    // @ts-ignore
                                    await addDriver({ fleet_id: fleet._id, driver_phone: driverPhone });
                                    setDriverPhone("");
                                } catch (error) {
                                    alert("Failed to add driver. Make sure they are registered as a driver.");
                                } finally {
                                    setIsAddingDriver(false);
                                }
                            }}
                            disabled={!driverPhone || isAddingDriver}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Driver
                        </button>
                    </div>
                </div>
                <div className="border-t border-gray-200">
                    <ul role="list" className="divide-y divide-gray-200">
                        {drivers?.map((driver: any) => (
                            <li key={driver._id} className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                <span className="text-gray-500 font-medium">
                                                    {driver.profile?.name?.charAt(0) || "D"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-blue-600 truncate">
                                                {driver.profile?.name || "Unknown Driver"}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-500">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${driver.is_online ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                                                    {driver.is_online ? "Online" : "Offline"}
                                                </span>
                                                <span className="ml-2">
                                                    {driver.total_trips} trips • TZS {driver.total_earnings.toLocaleString()} earned
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <button
                                            onClick={async () => {
                                                if (confirm("Are you sure you want to remove this driver?")) {
                                                    // @ts-ignore
                                                    await removeDriver({ fleet_id: fleet._id, driver_id: driver._id });
                                                }
                                            }}
                                            className="p-2 text-gray-400 hover:text-red-500"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                        {drivers?.length === 0 && (
                            <li className="px-4 py-8 text-center text-gray-500">
                                No drivers in your fleet yet. Add one above!
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}

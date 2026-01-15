'use client';

import { useState } from 'react';
import {
    ArrowLeft, Boxes, Search, Plus, Package, AlertTriangle,
    TrendingUp, TrendingDown, Edit, Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

// Mock inventory data
const mockInventory = [
    { id: '1', name: 'Electronics Box (Small)', sku: 'ELB-001', quantity: 150, minStock: 50, category: 'Electronics' },
    { id: '2', name: 'Clothing Bag (Medium)', sku: 'CLB-002', quantity: 30, minStock: 100, category: 'Apparel' },
    { id: '3', name: 'Food Container (Large)', sku: 'FDC-003', quantity: 200, minStock: 75, category: 'Food' },
    { id: '4', name: 'Documents Envelope', sku: 'DOE-004', quantity: 500, minStock: 200, category: 'Documents' },
    { id: '5', name: 'Fragile Box (Extra Care)', sku: 'FBX-005', quantity: 45, minStock: 50, category: 'Fragile' },
];

export default function InventoryPage() {
    const [search, setSearch] = useState('');

    const filteredInventory = mockInventory.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase())
    );

    const lowStockItems = mockInventory.filter(item => item.quantity < item.minStock);
    const totalItems = mockInventory.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div className="p-6 lg:p-8 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/business" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Inventory</h1>
                        <p className="text-slate-400">Manage your stock and supplies</p>
                    </div>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                            <Boxes className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{mockInventory.length}</p>
                            <p className="text-sm text-slate-400">Product Types</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                            <Package className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{totalItems}</p>
                            <p className="text-sm text-slate-400">Total Units</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className={`border ${lowStockItems.length > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-800 border-slate-700'}`}>
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${lowStockItems.length > 0 ? 'bg-red-500/20' : 'bg-slate-700'}`}>
                            <AlertTriangle className={`w-6 h-6 ${lowStockItems.length > 0 ? 'text-red-500' : 'text-slate-500'}`} />
                        </div>
                        <div>
                            <p className={`text-2xl font-bold ${lowStockItems.length > 0 ? 'text-red-400' : 'text-white'}`}>
                                {lowStockItems.length}
                            </p>
                            <p className="text-sm text-slate-400">Low Stock Items</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <Input
                        placeholder="Search by name or SKU..."
                        value={search}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                        className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    />
                </div>
            </div>

            {/* Inventory Table */}
            <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-700">
                                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Product</th>
                                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">SKU</th>
                                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Category</th>
                                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Quantity</th>
                                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInventory.map((item) => {
                                    const isLowStock = item.quantity < item.minStock;
                                    return (
                                        <tr key={item.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                                                        <Package className="w-5 h-5 text-slate-400" />
                                                    </div>
                                                    <span className="text-white font-medium">{item.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-slate-400 font-mono">{item.sku}</td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-lg">
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-bold ${isLowStock ? 'text-red-400' : 'text-white'}`}>
                                                        {item.quantity}
                                                    </span>
                                                    <span className="text-slate-500 text-sm">/ {item.minStock} min</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {isLowStock ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full">
                                                        <TrendingDown className="w-3 h-3" />
                                                        LOW STOCK
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">
                                                        <TrendingUp className="w-3 h-3" />
                                                        IN STOCK
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                                                        <Edit className="w-3 h-3" />
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="border-red-600/50 text-red-400 hover:bg-red-500/10">
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filteredInventory.length === 0 && (
                            <div className="p-12 text-center">
                                <Boxes className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-400">No inventory items found</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

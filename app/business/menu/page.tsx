'use client';

import { useState } from 'react';
import { ArrowLeft, FileText, Search, Plus, Edit, Trash2, Package, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

const mockProducts = [
    { id: '1', name: 'Express Delivery', price: 5000, category: 'Service', active: true, description: 'Same-day delivery' },
    { id: '2', name: 'Standard Delivery', price: 3000, category: 'Service', active: true, description: 'Next-day delivery' },
    { id: '3', name: 'Bulk Shipping', price: 500, category: 'Service', active: true, description: 'Per kg pricing' },
    { id: '4', name: 'Food Box', price: 2500, category: 'Packaging', active: true, description: 'Insulated container' },
    { id: '5', name: 'Gift Wrapping', price: 1500, category: 'Add-on', active: false, description: 'Premium wrapping' },
];

export default function MenuPage() {
    const [search, setSearch] = useState('');

    const filteredProducts = mockProducts.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="p-6 lg:p-8 min-h-screen">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/business" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Menu / Catalog</h1>
                    <p className="text-slate-400">Manage products and pricing</p>
                </div>
            </div>

            <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <Input placeholder="Search..." value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                        className="pl-10 bg-slate-800 border-slate-700 text-white" />
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />Add Product
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {filteredProducts.map((p) => (
                    <Card key={p.id} className="bg-slate-800 border-slate-700">
                        <CardContent className="p-5">
                            <div className="flex justify-between mb-3">
                                <div>
                                    <h3 className="text-white font-bold">{p.name}</h3>
                                    <span className="text-xs text-slate-500">{p.category}</span>
                                </div>
                                <p className="text-green-400 font-bold">TZS {p.price.toLocaleString()}</p>
                            </div>
                            <p className="text-sm text-slate-400 mb-4">{p.description}</p>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="flex-1 border-slate-600 text-slate-300">
                                    <Edit className="w-3 h-3 mr-1" />Edit
                                </Button>
                                <Button size="sm" variant="outline" className="border-red-600/50 text-red-400">
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

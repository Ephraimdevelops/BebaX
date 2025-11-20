'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { useToast } from '@/hooks/use-toast';
import FileUploader from './FileUploader';
import { Truck, Upload, CheckCircle, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

export default function DriverRegistration() {
    const { user } = useUser();
    const { toast } = useToast();
    const registerDriver = useMutation(api.drivers.register);
    const uploadDocuments = useMutation(api.fileUpload.uploadDriverDocuments);
    const createVehicle = useMutation(api.vehicles.create);

    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form data
    const [personalInfo, setPersonalInfo] = useState({
        nidaNumber: '',
        licenseNumber: '',
    });

    const [documents, setDocuments] = useState<{
        nidaPhoto: string | null;
        licensePhoto: string | null;
        insurancePhoto: string | null;
        roadPermitPhoto: string | null;
    }>({
        nidaPhoto: null,
        licensePhoto: null,
        insurancePhoto: null,
        roadPermitPhoto: null,
    });

    const [vehicleInfo, setVehicleInfo] = useState<{
        type: string;
        plateNumber: string;
        capacityKg: string;
        photos: string[];
    }>({
        type: '',
        plateNumber: '',
        capacityKg: '',
        photos: [],
    });

    const handlePersonalInfoSubmit = async () => {
        if (!personalInfo.nidaNumber || !personalInfo.licenseNumber) {
            toast({
                title: 'Missing Information',
                description: 'Please fill in all required fields',
                variant: 'destructive',
            });
            return;
        }
        setStep(2);
    };

    const handleDocumentsSubmit = async () => {
        if (!documents.nidaPhoto || !documents.licensePhoto) {
            toast({
                title: 'Missing Documents',
                description: 'Please upload NIDA and License photos',
                variant: 'destructive',
            });
            return;
        }
        setStep(3);
    };

    const handleFinalSubmit = async () => {
        if (!vehicleInfo.type || !vehicleInfo.plateNumber || !vehicleInfo.capacityKg) {
            toast({
                title: 'Missing Information',
                description: 'Please complete vehicle information',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            // Get current location (or use a default if geolocation fails)
            const location: { lat: number; lng: number } = await new Promise((resolve) => {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => resolve({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        }),
                        () => resolve({ lat: -6.7924, lng: 39.2083 }) // Default to Dar es Salaam
                    );
                } else {
                    resolve({ lat: -6.7924, lng: 39.2083 });
                }
            });

            // 1. Register driver with all required fields
            const driverId = await registerDriver({
                license_number: personalInfo.licenseNumber,
                nida_number: personalInfo.nidaNumber,
                vehicle_type: vehicleInfo.type,
                vehicle_plate: vehicleInfo.plateNumber,
                capacity_kg: parseInt(vehicleInfo.capacityKg),
                payout_method: "mpesa", // Default payout method
                payout_number: "", // Will be set later in driver profile
                location: location,
            });

            // 2. Upload documents (only include non-null values)
            const documentsToUpload: any = {};
            if (documents.nidaPhoto) documentsToUpload.nida_photo = documents.nidaPhoto;
            if (documents.licensePhoto) documentsToUpload.license_photo = documents.licensePhoto;
            if (documents.insurancePhoto) documentsToUpload.insurance_photo = documents.insurancePhoto;
            if (documents.roadPermitPhoto) documentsToUpload.road_permit_photo = documents.roadPermitPhoto;

            if (Object.keys(documentsToUpload).length > 0) {
                await uploadDocuments(documentsToUpload);
            }

            // 3. Create vehicle (if needed - vehicle is already created in register mutation)
            // This step may be redundant depending on your backend logic

            toast({
                title: 'Registration Submitted! 🎉',
                description: 'Your application is under review. We\'ll notify you once approved.',
            });

            // Redirect to dashboard
            window.location.href = '/';
        } catch (error) {
            toast({
                title: 'Registration Failed',
                description: error instanceof Error ? error.message : 'Please try again',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-bebax-green rounded-3xl flex items-center justify-center mx-auto mb-4">
                        <Truck className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-bebax-black mb-2">Become a BebaX Driver</h1>
                    <p className="text-gray-600">Complete the registration to start earning</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-8">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center flex-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step >= s ? 'bg-bebax-green text-white' : 'bg-gray-200 text-gray-500'
                                }`}>
                                {step > s ? <CheckCircle className="w-6 h-6" /> : s}
                            </div>
                            {s < 3 && (
                                <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-bebax-green' : 'bg-gray-200'
                                    }`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <div className="bg-white rounded-2xl shadow-bebax-xl p-6">
                    {/* Step 1: Personal Information */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Personal Information</h2>
                                <p className="text-gray-600">Enter your identification details</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">NIDA Number *</label>
                                <input
                                    type="text"
                                    placeholder="Enter your NIDA number"
                                    className="input-bebax"
                                    value={personalInfo.nidaNumber}
                                    onChange={(e) => setPersonalInfo({ ...personalInfo, nidaNumber: e.target.value })}
                                    maxLength={20}
                                />
                                <p className="text-xs text-gray-500 mt-1">Your National ID number</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Driver License Number *</label>
                                <input
                                    type="text"
                                    placeholder="Enter your license number"
                                    className="input-bebax"
                                    value={personalInfo.licenseNumber}
                                    onChange={(e) => setPersonalInfo({ ...personalInfo, licenseNumber: e.target.value })}
                                    maxLength={20}
                                />
                                <p className="text-xs text-gray-500 mt-1">Your valid driver's license number</p>
                            </div>

                            <button
                                onClick={handlePersonalInfoSubmit}
                                className="w-full btn-bebax-primary flex items-center justify-center space-x-2"
                            >
                                <span>Continue</span>
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* Step 2: Documents */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Upload Documents</h2>
                                <p className="text-gray-600">Upload clear photos of your documents</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">NIDA Photo *</label>
                                <FileUploader
                                    category="driver_document"
                                    maxFiles={1}
                                    accept="image/*"
                                    onUploadComplete={(urls) => setDocuments({ ...documents, nidaPhoto: urls[0] })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Driver License Photo *</label>
                                <FileUploader
                                    category="driver_document"
                                    maxFiles={1}
                                    accept="image/*"
                                    onUploadComplete={(urls) => setDocuments({ ...documents, licensePhoto: urls[0] })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Insurance Photo</label>
                                <FileUploader
                                    category="driver_document"
                                    maxFiles={1}
                                    accept="image/*"
                                    onUploadComplete={(urls) => setDocuments({ ...documents, insurancePhoto: urls[0] })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Road Permit Photo</label>
                                <FileUploader
                                    category="driver_document"
                                    maxFiles={1}
                                    accept="image/*"
                                    onUploadComplete={(urls) => setDocuments({ ...documents, roadPermitPhoto: urls[0] })}
                                />
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 btn-bebax-secondary flex items-center justify-center space-x-2"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    <span>Back</span>
                                </button>
                                <button
                                    onClick={handleDocumentsSubmit}
                                    className="flex-1 btn-bebax-primary flex items-center justify-center space-x-2"
                                >
                                    <span>Continue</span>
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Vehicle Information */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Vehicle Information</h2>
                                <p className="text-gray-600">Tell us about your vehicle</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-3">Vehicle Type *</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { type: 'tricycle', name: 'Tricycle', icon: '🛺', capacity: '300' },
                                        { type: 'van', name: 'Van', icon: '🚐', capacity: '1000' },
                                        { type: 'truck', name: 'Truck', icon: '🚚', capacity: '3000' },
                                        { type: 'semitrailer', name: 'Semi-trailer', icon: '🚛', capacity: '10000' },
                                    ].map((v) => (
                                        <button
                                            key={v.type}
                                            type="button"
                                            onClick={() => setVehicleInfo({ ...vehicleInfo, type: v.type, capacityKg: v.capacity })}
                                            className={vehicleInfo.type === v.type ? 'vehicle-card-selected' : 'vehicle-card'}
                                        >
                                            <span className="text-3xl mb-2">{v.icon}</span>
                                            <p className="font-medium">{v.name}</p>
                                            <p className="text-xs text-gray-600">{v.capacity}kg capacity</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Plate Number *</label>
                                <input
                                    type="text"
                                    placeholder="e.g., T 123 ABC"
                                    className="input-bebax"
                                    value={vehicleInfo.plateNumber}
                                    onChange={(e) => setVehicleInfo({ ...vehicleInfo, plateNumber: e.target.value.toUpperCase() })}
                                    maxLength={15}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Vehicle Photos (Optional)</label>
                                <FileUploader
                                    category="vehicle_photo"
                                    maxFiles={5}
                                    accept="image/*"
                                    onUploadComplete={(urls) => setVehicleInfo({ ...vehicleInfo, photos: urls })}
                                />
                                <p className="text-xs text-gray-500 mt-1">Upload up to 5 photos of your vehicle</p>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setStep(2)}
                                    className="flex-1 btn-bebax-secondary flex items-center justify-center space-x-2"
                                    disabled={isSubmitting}
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    <span>Back</span>
                                </button>
                                <button
                                    onClick={handleFinalSubmit}
                                    className="flex-1 btn-bebax-primary flex items-center justify-center space-x-2"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Submitting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            <span>Submit Application</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Help Text */}
                <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                    <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-blue-900">Verification Process</p>
                            <p className="text-xs text-blue-700 mt-1">
                                Your application will be reviewed within 24-48 hours. We'll notify you via SMS once approved.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

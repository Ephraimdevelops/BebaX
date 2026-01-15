export const REFERENCE_OBJECTS = [
    {
        id: 's',
        label: 'Small',
        reference: 'Envelope, Keys, Food',
        icon: '✉️',
        vehicle_class: 'boda',
        photo_required: false
    },
    {
        id: 'm',
        label: 'Medium',
        reference: 'Sack (Mkaa), Bag, TV',
        icon: '🎒',
        vehicle_class: 'boda',
        photo_required: false
    },
    {
        id: 'l',
        label: 'Large',
        reference: 'Sofa, Fridge, Bed',
        icon: '🛋️',
        vehicle_class: 'toyo',
        photo_required: true
    },
    {
        id: 'xl',
        label: 'Bulky',
        reference: 'Timber, Cement, Move',
        icon: '🧱',
        vehicle_class: 'kirikuu',
        photo_required: true
    }
];

export const HOUSE_SIZES = [
    {
        id: 'studio',
        label: 'Studio / 1 Room',
        labelSw: 'Chumba Kimoja',
        icon: '🏠',
        description: 'Fits: Bed, Fridge, TV, 5 Boxes',
        vehicle_class: 'kirikuu',
        helpers: 2,
    },
    {
        id: '2-3rooms',
        label: '2-3 Rooms',
        labelSw: 'Vyumba Viwili',
        icon: '🏠🏠',
        description: 'Fits: Full Family Home',
        vehicle_class: 'canter',
        helpers: 4, // "Speed Squad"
    },
    {
        id: 'big',
        label: 'Big Move',
        labelSw: 'Nyumba Nzima',
        icon: '🏢',
        description: 'Large House or Office',
        vehicle_class: 'fuso',
        helpers: 6, // "Heavy Lifters"
    },
];

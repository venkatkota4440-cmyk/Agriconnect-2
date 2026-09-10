// Demo / sample data for AgriLink 360 (clearly labeled as sample data in UI)
export const CROPS = [
  { name: 'Tomato', category: 'Vegetable', unit: 'kg', base: 26 },
  { name: 'Onion', category: 'Vegetable', unit: 'kg', base: 22 },
  { name: 'Potato', category: 'Vegetable', unit: 'kg', base: 18 },
  { name: 'Green Chilli', category: 'Vegetable', unit: 'kg', base: 40 },
  { name: 'Wheat', category: 'Grain', unit: 'quintal', base: 2400 },
  { name: 'Rice (Paddy)', category: 'Grain', unit: 'quintal', base: 2100 },
  { name: 'Maize', category: 'Grain', unit: 'quintal', base: 2000 },
  { name: 'Cotton', category: 'Cash Crop', unit: 'quintal', base: 7200 },
  { name: 'Soybean', category: 'Oilseed', unit: 'quintal', base: 4600 },
  { name: 'Groundnut', category: 'Oilseed', unit: 'quintal', base: 6100 },
  { name: 'Turmeric', category: 'Spice', unit: 'quintal', base: 13500 },
  { name: 'Banana', category: 'Fruit', unit: 'dozen', base: 45 },
  { name: 'Mango', category: 'Fruit', unit: 'kg', base: 60 },
  { name: 'Sugarcane', category: 'Cash Crop', unit: 'quintal', base: 340 },
  { name: 'Green Gram (Moong)', category: 'Pulse', unit: 'quintal', base: 7800 },
]

export const MARKETS = [
  { name: 'Azadpur Mandi', state: 'Delhi', district: 'North Delhi', lat: 28.7076, lng: 77.171 },
  { name: 'Vashi APMC', state: 'Maharashtra', district: 'Navi Mumbai', lat: 19.0662, lng: 73.0 },
  { name: 'Kolar Market', state: 'Karnataka', district: 'Kolar', lat: 13.1367, lng: 78.1292 },
  { name: 'Guntur Yard', state: 'Andhra Pradesh', district: 'Guntur', lat: 16.3067, lng: 80.4365 },
  { name: 'Nashik APMC', state: 'Maharashtra', district: 'Nashik', lat: 19.9975, lng: 73.7898 },
  { name: 'Hubli Market', state: 'Karnataka', district: 'Dharwad', lat: 15.3647, lng: 75.124 },
  { name: 'Indore Mandi', state: 'Madhya Pradesh', district: 'Indore', lat: 22.7196, lng: 75.8577 },
  { name: 'Ludhiana Mandi', state: 'Punjab', district: 'Ludhiana', lat: 30.901, lng: 75.8573 },
  { name: 'Madurai Market', state: 'Tamil Nadu', district: 'Madurai', lat: 9.9252, lng: 78.1198 },
  { name: 'Bowenpally Market', state: 'Telangana', district: 'Hyderabad', lat: 17.4813, lng: 78.4772 },
]

export const DEMAND = [
  { crop: 'Tomato', level: 'High', requirementQty: 12000, avgOfferedPrice: 27, trend: 'up' },
  { crop: 'Onion', level: 'High', requirementQty: 18000, avgOfferedPrice: 24, trend: 'up' },
  { crop: 'Potato', level: 'Medium', requirementQty: 9000, avgOfferedPrice: 19, trend: 'flat' },
  { crop: 'Green Chilli', level: 'High', requirementQty: 3500, avgOfferedPrice: 44, trend: 'up' },
  { crop: 'Wheat', level: 'Medium', requirementQty: 5200, avgOfferedPrice: 2450, trend: 'flat' },
  { crop: 'Rice (Paddy)', level: 'High', requirementQty: 8800, avgOfferedPrice: 2180, trend: 'up' },
  { crop: 'Cotton', level: 'Medium', requirementQty: 2400, avgOfferedPrice: 7350, trend: 'down' },
  { crop: 'Soybean', level: 'Low', requirementQty: 1500, avgOfferedPrice: 4550, trend: 'down' },
  { crop: 'Turmeric', level: 'High', requirementQty: 900, avgOfferedPrice: 13900, trend: 'up' },
  { crop: 'Mango', level: 'High', requirementQty: 6400, avgOfferedPrice: 62, trend: 'up' },
]

// Sample buyers, farmers and transport providers (coordinates near demo markets)
export const SAMPLE_USERS = [
  { name: 'FreshMart Retail', role: 'buyer', buyerType: 'Retailer', crops: ['Tomato', 'Onion', 'Potato'], lat: 28.61, lng: 77.23, label: 'New Delhi', rating: 4.6, verified: true, offeredPrice: 27, phone: '+91-98110-11111' },
  { name: 'AgroWholesale Pvt Ltd', role: 'buyer', buyerType: 'Wholesaler', crops: ['Tomato', 'Green Chilli', 'Mango'], lat: 19.07, lng: 72.99, label: 'Navi Mumbai', rating: 4.8, verified: true, offeredPrice: 29, phone: '+91-98200-22222' },
  { name: 'Sunrise Food Processing', role: 'buyer', buyerType: 'Food processing company', crops: ['Tomato', 'Turmeric', 'Soybean'], lat: 19.99, lng: 73.79, label: 'Nashik', rating: 4.5, verified: true, offeredPrice: 31, phone: '+91-98220-33333' },
  { name: 'Spice Exporters Co', role: 'buyer', buyerType: 'Exporter', crops: ['Turmeric', 'Green Chilli'], lat: 16.30, lng: 80.44, label: 'Guntur', rating: 4.7, verified: true, offeredPrice: 14200, phone: '+91-98490-44444' },
  { name: 'Grand Hotel Kitchens', role: 'buyer', buyerType: 'Restaurant', crops: ['Tomato', 'Onion', 'Banana'], lat: 13.14, lng: 78.13, label: 'Kolar', rating: 4.3, verified: false, offeredPrice: 26, phone: '+91-98860-55555' },
  { name: 'State Cooperative Board', role: 'buyer', buyerType: 'Institutional buyer', crops: ['Wheat', 'Rice (Paddy)', 'Maize'], lat: 30.90, lng: 75.86, label: 'Ludhiana', rating: 4.9, verified: true, offeredPrice: 2500, phone: '+91-98150-66666' },
  { name: 'Ravi Kumar', role: 'farmer', crops: ['Tomato'], lat: 13.15, lng: 78.14, label: 'Kolar', rating: 4.4, verified: true, phone: '+91-90000-77777' },
  { name: 'Lakshmi Devi', role: 'farmer', crops: ['Turmeric'], lat: 16.31, lng: 80.45, label: 'Guntur', rating: 4.6, verified: true, phone: '+91-90000-88888' },
  { name: 'Harpreet Singh', role: 'farmer', crops: ['Wheat'], lat: 30.91, lng: 75.85, label: 'Ludhiana', rating: 4.7, verified: true, phone: '+91-90000-99999' },
]

export const SAMPLE_TRANSPORT = [
  { name: 'Balaji Transport', vehicleType: 'Truck (10 ton)', lat: 28.66, lng: 77.20, label: 'Delhi', availability: 'Available', costPerKm: 45, rating: 4.5, phone: '+91-99000-10001' },
  { name: 'Krishna Mini Carriers', vehicleType: 'Mini Truck (2 ton)', lat: 19.05, lng: 73.02, label: 'Navi Mumbai', availability: 'Available', costPerKm: 28, rating: 4.2, phone: '+91-99000-10002' },
  { name: 'Farmer Tractor Service', vehicleType: 'Tractor Trolley', lat: 13.13, lng: 78.12, label: 'Kolar', availability: 'Busy', costPerKm: 22, rating: 4.0, phone: '+91-99000-10003' },
  { name: 'QuickPick Logistics', vehicleType: 'Pickup (1 ton)', lat: 16.32, lng: 80.43, label: 'Guntur', availability: 'Available', costPerKm: 20, rating: 4.6, phone: '+91-99000-10004' },
  { name: 'Highway Movers', vehicleType: 'Truck (16 ton)', lat: 22.72, lng: 75.86, label: 'Indore', availability: 'Available', costPerKm: 52, rating: 4.4, phone: '+91-99000-10005' },
]

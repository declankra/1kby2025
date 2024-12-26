// app/api/sales/ios/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from 'jsonwebtoken';

// During build/development, return mock data to prevent API calls
const MOCK_DATA = [
  { date: '2024-08-17', amount: 6.44181},
  { date: '2024-08-18', amount: 4.114697},
  { date: '2024-08-19', amount: 0.99},
  { date: '2024-08-20', amount: 1.071675},
  { date: '2024-08-22', amount: 2.82014},
  { date: '2024-08-23', amount: 2.34333},
  { date: '2024-08-27', amount: 0.99},
  { date: '2024-08-28', amount: 2.34333},
  { date: '2024-12-01', amount: .99},
  { date: '2024-12-02', amount: 1.04 },
  { date: '2024-12-03', amount: 1.9 },
  { date: '2024-12-05', amount: 2.33 },
  { date: '2024-12-06', amount: 1.82 },
  { date: '2024-12-07', amount: 0.42 },
  { date: '2024-12-08', amount: 1.04 },
  { date: '2024-12-10', amount: 1.28952 },
  { date: '2024-12-12', amount: 0.99 },
  { date: '2024-12-14', amount: 2.27962 },
  { date: '2024-12-15', amount: 2.29284 },
  { date: '2024-12-16', amount: 1.015906 },
  { date: '2024-12-17', amount: 3.972091 },
  { date: '2024-12-19', amount: 0.916215 },
  { date: '2024-12-20', amount: 3.07157 },
  { date: '2024-12-23', amount: 1.040986 },
];

// Only make real API calls in production
const isProduction = process.env.NODE_ENV === 'production';

export async function GET(request: NextRequest) {
  // During build/development, return mock data
  if (!isProduction) {
    console.debug('📊 Development environment: Using mock data');
    return NextResponse.json(MOCK_DATA);
  }

  try {
    // Verify we have all required credentials
    const keyId = process.env.APP_STORE_KEY_ID;
    const issuerId = process.env.APP_STORE_ISSUER_ID;
    const privateKey = process.env.APP_STORE_PRIVATE_KEY;
    const vendorNumber = process.env.APP_STORE_VENDOR_NUMBER;

    if (!keyId || !issuerId || !privateKey || !vendorNumber) {
      throw new Error('Missing required App Store credentials');
    }

    // Generate JWT token
    const token = jwt.sign({
      iss: issuerId,
      exp: Math.floor(Date.now() / 1000) + (20 * 60), // 20 minutes
      aud: 'appstoreconnect-v1'
    }, privateKey, {
      algorithm: 'ES256',
      keyid: keyId,
    });

    // Set up dates for the query
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = '2024-03-01';

    // Make the API request
    const response = await fetch(
      `https://api.appstoreconnect.apple.com/v1/salesReports?` + 
      `filter[frequency]=DAILY&` +
      `filter[reportDate]=${startDate}&` +
      `filter[reportType]=SALES&` +
      `filter[vendorNumber]=${vendorNumber}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('App Store API Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`App Store API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(transformAppStoreData(data));

  } catch (error) {
    console.error('App Store API error:', error);
    
    // During build/development, return mock data instead of error
    if (!isProduction) {
        console.debug('⚠️ Using mock data due to API error in development environment');
        return NextResponse.json(MOCK_DATA);
    }
    
    console.error('❌ Production environment: Cannot fallback to mock data');
    return NextResponse.json(
      { error: 'Failed to fetch App Store data' },
      { status: 500 }
    );
  }
}

function transformAppStoreData(data: any) {
  // Transform the data into a format suitable for the chart
  try {
    return data.map((item: any) => ({
      date: item.date,
      amount: parseFloat(item.proceeds || '0')
    }));
  } catch (error) {
    console.error('Error transforming App Store data:', error);
    return [];
  }
}
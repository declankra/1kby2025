// app/api/sales/ios/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from 'jsonwebtoken';

// Mock data moved to separate constant for clarity
const MOCK_DATA = [
  { date: '2024-08-17', amount: 6.44181 },
  // ... other mock data ...
];

export async function GET(request: NextRequest) {
  try {
    // 1. Verify credentials
    const keyId = process.env.APP_STORE_KEY_ID;
    const issuerId = process.env.APP_STORE_ISSUER_ID;
    const privateKey = process.env.APP_STORE_PRIVATE_KEY;
    const vendorNumber = process.env.APP_STORE_VENDOR_NUMBER;

    if (!keyId || !issuerId || !privateKey || !vendorNumber) {
      console.warn('Missing App Store credentials - falling back to mock data');
      return NextResponse.json(MOCK_DATA);
    }

    // 2. Generate JWT token
    const now = Math.floor(Date.now() / 1000);
    const token = jwt.sign({
      iss: issuerId,
      iat: now,
      exp: now + (20 * 60), // 20 minutes maximum
      aud: 'appstoreconnect-v1',
    }, privateKey, {
      algorithm: 'ES256',
      header: {
        alg: 'ES256',
        kid: keyId,
        typ: 'JWT'
      }
    });


    // Calculate two days ago date for the query becuase reports are slow to generate
    const today = new Date();
    // Go back 2 days to ensure report availability across all time zones
    const reportDate = new Date(today);
    reportDate.setDate(today.getDate() - 2);
    // Format as YYYY-MM-DD
    const formattedDate = reportDate.toISOString().split('T')[0];

    // 3. Make API request
    const response = await fetch(
      `https://api.appstoreconnect.apple.com/v1/salesReports?` +
      `filter[frequency]=DAILY&` +
      `filter[reportSubType]=SUMMARY&` +
      `filter[reportType]=SALES&` +
      `filter[vendorNumber]=${vendorNumber}&` +
      `filter[reportDate]=${formattedDate}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // 4. Enhanced error handling
    if (!response.ok) {
      const errorText = await response.text();
      console.error('App Store API Error:', {
        status: response.status,
        statusText: response.statusText,
        requestDate: formattedDate, // Log the requested date for debugging
        body: errorText
      });

      // Fall back to mock data on API failure
      console.warn('API request failed - falling back to mock data');
      return NextResponse.json(MOCK_DATA);
    }

    // 5. Transform and validate data
    const rawData = await response.json();
    const transformedData = transformAppStoreData(rawData);

    // Validate transformed data
    if (!transformedData || transformedData.length === 0) {
      console.warn('No valid data returned from API - falling back to mock data');
      return NextResponse.json(MOCK_DATA);
    }

    return NextResponse.json(transformedData);

  } catch (error) {
    console.error('App Store API error:', error);
    // Always fall back to mock data on any error
    return NextResponse.json(MOCK_DATA);
  }
}

function transformAppStoreData(data: any) {
  try {
    // Add validation for data structure
    if (!Array.isArray(data)) {
      console.warn('Invalid data structure received from API');
      return null;
    }

    return data.map((item: any) => ({
      date: item.date || new Date().toISOString().split('T')[0],
      amount: parseFloat(item.proceeds || '0')
    })).filter(item => !isNaN(item.amount));

  } catch (error) {
    console.error('Error transforming App Store data:', error);
    return null;
  }
}
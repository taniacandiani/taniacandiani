import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { v2 as cloudinary } from 'cloudinary';

async function testCloudinary() {
  console.log('🔍 Testing Cloudinary credentials...\n');

  console.log('📋 Current configuration:');
  console.log(`   Cloud Name: ${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}`);
  console.log(`   API Key: ${process.env.CLOUDINARY_API_KEY}`);
  console.log(`   API Secret: ${process.env.CLOUDINARY_API_SECRET ? '✓ Set' : '✗ Not set'}\n`);

  try {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // Test API call - get account usage
    const result = await cloudinary.api.usage();

    console.log('✅ Cloudinary credentials are VALID!\n');
    console.log('📊 Account info:');
    console.log(`   Plan: ${result.plan || 'Free'}`);
    console.log(`   Credits: ${result.credits?.usage || 0} / ${result.credits?.limit || 'unlimited'}`);
    console.log(`   Storage: ${(result.storage.usage / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Bandwidth: ${(result.bandwidth.usage / 1024 / 1024).toFixed(2)} MB`);

  } catch (error: any) {
    console.error('❌ Cloudinary credentials are INVALID!\n');
    console.error('Full Error:', JSON.stringify(error, null, 2));
    console.error('\nError message:', error.message);
    console.error('Error http_code:', error.http_code);

    if (error.http_code === 401) {
      console.error('\n💡 Possible causes:');
      console.error('   1. API Key is incorrect');
      console.error('   2. API Secret is incorrect');
      console.error('   3. Cloud Name is incorrect');
      console.error('\n🔑 Please verify your credentials at:');
      console.error('   https://console.cloudinary.com/settings/c-');
    }
  }
}

testCloudinary();

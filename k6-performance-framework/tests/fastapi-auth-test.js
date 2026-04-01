// Test authentication with FastAPI Auth Service
import http from 'k6/http';

export default function () {
  console.log('🔐 Testing FastAPI Authentication');
  
  const loginUrl = 'https://staging.authapi.hotelashleshmanipal.com/api/authorize/v2/signin';
  
  // Test user credentials
  const userPayload = 'username=shishir+dhoni@codezyng.com&password=Test1234&organization_id=a9395930-21bb-4a28-8e48-8bdf71294f62';
  
  console.log('Testing user login...');
  const userResponse = http.post(loginUrl, userPayload, {
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    }
  });
  
  console.log(`User login status: ${userResponse.status}`);
  console.log(`User login response: ${userResponse.body}`);
  
  if (userResponse.status === 200) {
    const tokenData = JSON.parse(userResponse.body);
    console.log('✅ User login successful!');
    console.log(`Success: ${tokenData.success}`);
    console.log(`Token type: ${tokenData.data ? 'JWT' : 'None'}`);
    
    if (tokenData.data && tokenData.data.access_token) {
      // Test the token with the API
      const testHeaders = {
        'Authorization': `Bearer ${tokenData.data.access_token}`,
        'Content-Type': 'application/json'
      };
      
      const apiTest = http.get('https://staging.api.hotelashleshmanipal.com/api/v1/users/me', { headers: testHeaders });
      console.log(`API test with token: ${apiTest.status}`);
      console.log(`API response: ${apiTest.body}`);
    }
  }
  
  // Test admin credentials
  console.log('\nTesting admin login...');
  const adminPayload = 'username=adityashekhar@codezyng.com&password=test1234&organization_id=a9395930-21bb-4a28-8e48-8bdf71294f62';
  
  const adminResponse = http.post(loginUrl, adminPayload, {
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    }
  });
  
  console.log(`Admin login status: ${adminResponse.status}`);
  console.log(`Admin login response: ${adminResponse.body}`);
}

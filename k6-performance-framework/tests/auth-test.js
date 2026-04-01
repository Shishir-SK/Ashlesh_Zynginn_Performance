// Test authentication with Keycloak
import http from 'k6/http';

export default function () {
  console.log('🔐 Testing Keycloak Authentication');
  
  const loginUrl = 'https://staging.auth.hotelashleshmanipal.com/realms/master/protocol/openid-connect/token';
  
  // Test user credentials
  const userPayload = 'grant_type=password&username=shishir+dhoni@codezyng.com&password=Test1234&client_id=admin-cli';
  
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
    console.log(`Token type: ${tokenData.token_type}`);
    console.log(`Expires in: ${tokenData.expires_in}s`);
    
    // Test the token with the API
    const testHeaders = {
      'Authorization': `Bearer ${tokenData.access_token}`,
      'Content-Type': 'application/json'
    };
    
    const apiTest = http.get('https://staging.api.hotelashleshmanipal.com/api/v1/users/me', { headers: testHeaders });
    console.log(`API test with token: ${apiTest.status}`);
    console.log(`API response: ${apiTest.body}`);
  }
  
  // Test admin credentials
  console.log('\nTesting admin login...');
  const adminPayload = 'grant_type=password&username=adityashekhar@codezyng.com&password=test1234&client_id=admin-cli';
  
  const adminResponse = http.post(loginUrl, adminPayload, {
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    }
  });
  
  console.log(`Admin login status: ${adminResponse.status}`);
  console.log(`Admin login response: ${adminResponse.body}`);
}

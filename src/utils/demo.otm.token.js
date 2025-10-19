// demo.otm.token.js - Demo module showing how to use OTMTokenService

const OTMTokenService = require('../services/otm.token');

// Demo functions to test OTM Token Service
const OTMTokenDemo = {
    
    /**
     * Demo 1: Test getting a valid token
     */
    async testGetToken() {
        console.log('🧪 DEMO: Testing OTM token retrieval...');
        
        try {
            const token = await OTMTokenService.getValidToken();
            console.log('✅ Success: Got OTM token (length:', token ? token.length : 0, ')');
            console.log('🔑 Token prefix:', token ? token.substring(0, 20) + '...' : 'null');
            return token;
        } catch (error) {
            console.error('❌ Error getting token:', error.message);
            return null;
        }
    },

    /**
     * Demo 2: Test fetching today's surgeries
     */
    async testFetchSurgeries() {
        console.log('🧪 DEMO: Testing surgery data fetch...');
        
        try {
            const today = new Date().toISOString().split('T')[0];
            const surgeries = await OTMTokenService.fetchSurgeries(today, today);
            
            console.log('✅ Success: Fetched surgery data');
            console.log('📊 Raw response type:', Array.isArray(surgeries) ? 'array' : typeof surgeries);
            
            if (Array.isArray(surgeries)) {
                console.log('📊 Surgery count:', surgeries.length);
                if (surgeries.length > 0) {
                    console.log('📋 First surgery sample:', {
                        patient: surgeries[0]?.customer?.fullname || 'N/A',
                        method: surgeries[0]?.surgerymethod || 'N/A',
                        start: surgeries[0]?.start || 'N/A',
                        room: surgeries[0]?.room?.name || 'N/A'
                    });
                }
            } else if (surgeries && surgeries.data) {
                console.log('📊 Surgery count (nested):', surgeries.data.length || 0);
                if (surgeries.data.length > 0) {
                    console.log('📋 First surgery sample:', {
                        patient: surgeries.data[0]?.customer?.fullname || 'N/A',
                        method: surgeries.data[0]?.surgerymethod || 'N/A',
                        start: surgeries.data[0]?.start || 'N/A',
                        room: surgeries.data[0]?.room?.name || 'N/A'
                    });
                }
            }
            
            return surgeries;
        } catch (error) {
            console.error('❌ Error fetching surgeries:', error.message);
            return null;
        }
    },

    /**
     * Demo 3: Test fetching OTM users
     */
    async testFetchUsers() {
        console.log('🧪 DEMO: Testing OTM users fetch...');
        
        try {
            const users = await OTMTokenService.fetchUsers();
            
            console.log('✅ Success: Fetched OTM users');
            console.log('👥 Raw response type:', Array.isArray(users) ? 'array' : typeof users);
            
            let userArray = [];
            if (Array.isArray(users)) {
                userArray = users;
            } else if (users && Array.isArray(users.data)) {
                userArray = users.data;
            }
            
            console.log('👥 User count:', userArray.length);
            if (userArray.length > 0) {
                const samples = userArray.slice(0, 3).map(u => ({
                    id: u.id || u.taid || 'N/A',
                    name: u.fullname || u.name || 'N/A'
                }));
                console.log('👨‍⚕️ Sample users:', samples);
            }
            
            return users;
        } catch (error) {
            console.error('❌ Error fetching users:', error.message);
            return null;
        }
    },

    /**
     * Demo 4: Test making a custom OTM API request
     */
    async testCustomRequest() {
        console.log('🧪 DEMO: Testing custom OTM API request...');
        
        try {
            const rooms = await OTMTokenService.fetchRoomsWithDepartment();
            
            console.log('✅ Success: Fetched rooms with department info');
            console.log('🏥 Response type:', Array.isArray(rooms) ? 'array' : typeof rooms);
            
            if (Array.isArray(rooms)) {
                console.log('🏥 Room count:', rooms.length);
                if (rooms.length > 0) {
                    console.log('🏥 Sample room:', {
                        name: rooms[0]?.name || 'N/A',
                        department: rooms[0]?.department?.name || 'N/A'
                    });
                }
            }
            
            return rooms;
        } catch (error) {
            console.error('❌ Error fetching rooms:', error.message);
            return null;
        }
    },

    /**
     * Demo 5: Test token validation
     */
    async testTokenValidation() {
        console.log('🧪 DEMO: Testing token validation...');
        
        try {
            // First get a token
            const token = await OTMTokenService.getValidToken();
            if (!token) {
                console.log('❌ No token available for validation test');
                return false;
            }

            // Test validation
            const isValid = await OTMTokenService.validateToken(token);
            console.log('✅ Token validation result:', isValid ? 'VALID' : 'INVALID');
            return isValid;
            
        } catch (error) {
            console.error('❌ Error validating token:', error.message);
            return false;
        }
    },

    /**
     * Demo 6: Run all tests
     */
    async runAllTests() {
        console.log('🚀 DEMO: Running all OTM Token Service tests...\n');
        
        const results = {};
        
        console.log('═══ Test 1: Token Retrieval ═══');
        results.token = await this.testGetToken();
        console.log('');
        
        console.log('═══ Test 2: Token Validation ═══');
        results.validation = await this.testTokenValidation();
        console.log('');
        
        console.log('═══ Test 3: Fetch Surgeries ═══');
        results.surgeries = await this.testFetchSurgeries();
        console.log('');
        
        console.log('═══ Test 4: Fetch Users ═══');
        results.users = await this.testFetchUsers();
        console.log('');
        
        console.log('═══ Test 5: Custom Request ═══');
        results.rooms = await this.testCustomRequest();
        console.log('');
        
        console.log('═══ Test 6: Token Storage ═══');
        results.storage = await this.testTokenStorage();
        console.log('');
        
        console.log('🏁 DEMO COMPLETE! Results Summary:');
        console.log('- Token retrieved:', !!results.token);
        console.log('- Token valid:', !!results.validation);
        console.log('- Surgeries fetched:', !!results.surgeries);
        console.log('- Users fetched:', !!results.users);
        console.log('- Rooms fetched:', !!results.rooms);
        console.log('- Storage tested:', !!results.storage);
        
        return results;
    },

    /**
     * Demo 7: Test token storage with fixed dates
     */
    async testTokenStorage() {
        console.log('🧪 DEMO: Testing token storage with fixed dates (10/10/1010 10:10)...');
        
        try {
            // First, try to get stored token
            console.log('1️⃣ Getting stored token...');
            const stored = await OTMTokenService.getStoredToken();
            console.log('Stored token result:', stored ? 'FOUND' : 'NOT_FOUND');
            
            if (stored && stored.token) {
                console.log('📋 Stored token info:');
                console.log('- Token length:', stored.token.length);
                console.log('- Token prefix:', stored.token.substring(0, 20) + '...');
                console.log('- Expiry:', new Date(stored.expiry).toISOString());
            }
            
            // Test saving a dummy token
            console.log('2️⃣ Testing token save...');
            const dummyToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTczNDI3NDJ9.test';
            const saveResult = await OTMTokenService.saveToken(dummyToken);
            console.log('Save result:', saveResult ? 'SUCCESS' : 'FAILED');
            
            // Verify the saved token
            if (saveResult) {
                console.log('3️⃣ Verifying saved token...');
                const verified = await OTMTokenService.getStoredToken();
                console.log('Verification result:', verified && verified.token === dummyToken ? 'MATCH' : 'NO_MATCH');
            }
            
            return { stored, saveResult };
        } catch (error) {
            console.error('❌ Token storage test failed:', error.message);
            return null;
        }
    },

    /**
     * Demo 8: Quick test for debugging
     */
    async quickTest() {
        console.log('🔥 DEMO: Quick OTM test...');
        
        try {
            // Test basic API call
            console.log('1️⃣ Testing basic token retrieval...');
            const token = await OTMTokenService.getValidToken();
            console.log('Token status:', token ? `OK (${token.length} chars)` : 'MISSING');
            
            if (token) {
                console.log('2️⃣ Testing simple API call...');
                const rooms = await OTMTokenService.makeOTMRequest(
                    'https://otm.tahospital.vn/api/booking/roomwithdepartment?_=' + Date.now()
                );
                console.log('API call result:', Array.isArray(rooms) ? `${rooms.length} items` : typeof rooms);
            }
            
            return true;
        } catch (error) {
            console.error('❌ Quick test failed:', error.message);
            return false;
        }
    }
};

// Add to window for console testing
if (typeof window !== 'undefined') {
    window.OTMTokenDemo = OTMTokenDemo;
}

module.exports = OTMTokenDemo;

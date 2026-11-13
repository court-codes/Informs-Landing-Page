import { authDb } from '../store.js';

authDb.data.user = null;
authDb.data.sessions = {};
authDb.flush();
console.log('Board account removed. Visit /board/login to register informs@scu.edu with a new password.');

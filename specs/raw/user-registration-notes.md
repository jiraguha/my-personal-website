user registration page

form: email, password, confirm password
validate email client+server
password min 8, uppercase + number
confirm must match
POST /api/auth/register
argon2 hash, store in postgres
201 with user id + email, no hash
duplicate email → 409
after success show "check your email" (no actual email yet)
inline validation as you type
submit disabled until valid
spinner while loading
server error shown above form

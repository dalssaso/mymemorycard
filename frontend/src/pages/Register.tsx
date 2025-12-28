import { useState, FormEvent } from 'react'
import validator from 'validator'
import { Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'

export function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const isPasswordStrong =
    password.length > 0 &&
    validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
  const showPasswordFeedback = password.length > 0
  const showConfirmFeedback = confirmPassword.length > 0
  const passwordsMatch = password === confirmPassword
  const canSubmit =
    !!username && !!password && !!confirmPassword && passwordsMatch && isPasswordStrong && !isLoading

  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!passwordsMatch) {
      setError('Passwords do not match')
      return
    }

    if (!isPasswordStrong) {
      setError('Password must be at least 8 characters and include upper, lower, number, and symbol')
      return
    }

    setIsLoading(true)

    try {
      await register(username, password)
      navigate({ to: '/platforms/onboarding' })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to register')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        <h1 className="text-ctp-mauve mb-6 text-center">
          Create Account
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-ctp-red/20 border border-ctp-red text-ctp-red px-4 py-2 rounded">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input w-full"
              placeholder="Enter username"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input w-full"
              placeholder="Enter password"
              required
            />
            {showPasswordFeedback && (
              <p className={`mt-2 text-xs ${isPasswordStrong ? 'text-ctp-green' : 'text-ctp-red'}`}>
                {isPasswordStrong
                  ? 'Password looks strong'
                  : 'Use 8+ characters with upper, lower, number, and symbol'}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input w-full"
              placeholder="Confirm password"
              required
            />
            {showConfirmFeedback && (
              <p className={`mt-2 text-xs ${passwordsMatch ? 'text-ctp-green' : 'text-ctp-red'}`}>
                {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
              </p>
            )}
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={!canSubmit}
          >
            {isLoading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        
        <p className="text-center mt-4 text-zinc-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-ctp-teal hover:text-cyan-400 transition-colors"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

import { describe, it, expect } from 'vitest'
import { authAPI, gamesAPI, importAPI } from './api'

describe('API Client', () => {
  describe('authAPI', () => {
    it('should have register method', () => {
      expect(typeof authAPI.register).toBe('function')
    })

    it('should have login method', () => {
      expect(typeof authAPI.login).toBe('function')
    })

    it('should have me method', () => {
      expect(typeof authAPI.me).toBe('function')
    })
  })

  describe('gamesAPI', () => {
    it('should have getAll method', () => {
      expect(typeof gamesAPI.getAll).toBe('function')
    })

    it('should have getOne method', () => {
      expect(typeof gamesAPI.getOne).toBe('function')
    })

    it('should have updateStatus method', () => {
      expect(typeof gamesAPI.updateStatus).toBe('function')
    })

    it('should have updateRating method', () => {
      expect(typeof gamesAPI.updateRating).toBe('function')
    })
  })

  describe('importAPI', () => {
    it('should have bulk method', () => {
      expect(typeof importAPI.bulk).toBe('function')
    })
  })
})

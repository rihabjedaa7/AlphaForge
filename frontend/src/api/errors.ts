import axios from 'axios'
import type { ErrorResponse } from '../types'

export function getUserFacingError(error: unknown): string {
  if (axios.isAxiosError<ErrorResponse>(error)) {
    const code = error.response?.data?.code

    if (code === 'UNAUTHORIZED') return 'The API key was not accepted. Check your frontend environment settings.'
    if (code === 'NOT_READY') return 'This meeting is still being processed. Try again shortly.'
    if (code === 'NOT_FOUND') return 'That meeting memory could not be found.'
    if (code === 'VALIDATION_ERROR') return 'Please enter a more specific question.'
    if (code === 'UPSTREAM_ERROR') return 'The answer service is temporarily unavailable.'
  }

  return 'The meeting memory could not answer that right now. Please try again.'
}

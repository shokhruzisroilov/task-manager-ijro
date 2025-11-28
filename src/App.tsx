import { QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense, useEffect } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/auth'
import { LoadingSpinner } from './components/common'
import { queryClient } from './lib/queryClient'
import { useAuthStore } from './store/auth.store'

// Auth pages - direkt import
import { AuthLayout } from './pages/Auth/AuthLayout'
import { EmailVerification } from './pages/Auth/EmailVerification'
import { LoginForm } from './pages/Auth/LoginForm'
import { RegisterForm } from './pages/Auth/RegisterForm'

// Lazy load main pages
const WorkspacesPage = lazy(() =>
	import('./pages/Workspaces').then(module => ({
		default: module.WorkspacesPage,
	}))
)
const WorkspaceBoardsPage = lazy(() =>
	import('./pages/Workspaces').then(module => ({
		default: module.WorkspaceBoardsPage,
	}))
)
const BoardView = lazy(() =>
	import('./pages/Board').then(module => ({ default: module.BoardView }))
)
const NotFoundPage = lazy(() =>
	import('./pages/NotFound').then(module => ({ default: module.NotFoundPage }))
)

/**
 * PublicRoute Component
 * Redirects authenticated users away from auth pages
 */
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { isAuthenticated, isLoading } = useAuthStore()

	// Don't redirect while loading
	if (isLoading) {
		return <>{children}</>
	}

	// Redirect authenticated users to workspaces
	if (isAuthenticated) {
		return <Navigate to='/workspaces' replace />
	}

	return <>{children}</>
}

/**
 * Loading fallback component
 */
const LoadingFallback = () => (
	<div
		style={{
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
			minHeight: '100vh',
		}}
	>
		<LoadingSpinner />
	</div>
)

/**
 * Main App Component
 * Sets up routing and authentication
 */
function App() {
	const { loadUser } = useAuthStore()

	useEffect(() => {
		// Load user on app initialization
		loadUser()
	}, [loadUser])

	return (
		<QueryClientProvider client={queryClient}>
			<DndProvider backend={HTML5Backend}>
				<BrowserRouter>
					<Suspense fallback={<LoadingFallback />}>
						<Routes>
							{/* Public routes - Authentication */}
							<Route
								path='/login'
								element={
									<PublicRoute>
										<AuthLayout>
											<LoginForm />
										</AuthLayout>
									</PublicRoute>
								}
							/>
							<Route
								path='/register'
								element={
									<PublicRoute>
										<AuthLayout>
											<RegisterForm />
										</AuthLayout>
									</PublicRoute>
								}
							/>
							<Route
								path='/verify-email'
								element={
									<PublicRoute>
										<AuthLayout>
											<EmailVerification />
										</AuthLayout>
									</PublicRoute>
								}
							/>

							{/* Protected routes - Main application */}
							<Route
								path='/workspaces'
								element={
									<ProtectedRoute>
										<WorkspacesPage />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/workspaces/:workspaceId'
								element={
									<ProtectedRoute>
										<WorkspaceBoardsPage />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/boards/:boardId'
								element={
									<ProtectedRoute>
										<BoardView />
									</ProtectedRoute>
								}
							/>
							<Route
								path='/boards/:boardId/cards/:cardId'
								element={
									<ProtectedRoute>
										<BoardView />
									</ProtectedRoute>
								}
							/>

							{/* Default redirect */}
							<Route path='/' element={<Navigate to='/workspaces' replace />} />

							{/* 404 - Not Found */}
							<Route path='*' element={<NotFoundPage />} />
						</Routes>
					</Suspense>
				</BrowserRouter>
			</DndProvider>
		</QueryClientProvider>
	)
}

export default App

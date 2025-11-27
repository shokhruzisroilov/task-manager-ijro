import Login from '@/pages/Auth/Login'
import Home from '@/pages/Home'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

export const AppRoutes = () => (
	<BrowserRouter>
		<Routes>
			<Route path='/' element={<Home />} />
			<Route path='/login' element={<Login />} />
		</Routes>
	</BrowserRouter>
)

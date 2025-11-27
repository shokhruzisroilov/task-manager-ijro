import { QueryProvider } from './providers/QueryProvider'
import { ReduxProvider } from './providers/ReduxProvider'
import { AppRoutes } from './router/AppRoutes'

function App() {
	return (
		<ReduxProvider>
			<QueryProvider>
				<AppRoutes />
			</QueryProvider>
		</ReduxProvider>
	)
}

export default App

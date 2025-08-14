import { App, Spin } from 'antd';
import { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/es/integration/react';

import { GlobalStyles } from './assets/styles/styled';
import { ErrorBoundary } from './components/ErrorBoundary';
import ConfigurationsProvider from './components/providers/ConfigurationsProvider';
import { BaseRoutes } from './routes';
import { persistor, store } from './store';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: false,
			staleTime: 60 * 1000, // 1 min
		},
	},
});

const MyApp = () => {
	return (
		<Provider store={store}>
			<QueryClientProvider client={queryClient}>
				<ConfigurationsProvider loading={<Spin size='large' />}>
					<Suspense fallback={<Spin size='large' />}>
						<PersistGate loading={<Spin size='large' />} persistor={persistor}>
							<ErrorBoundary>
								<App>
									<BaseRoutes />
									<GlobalStyles />
								</App>
							</ErrorBoundary>
						</PersistGate>
					</Suspense>
				</ConfigurationsProvider>
				<ReactQueryDevtools initialIsOpen={false} position='bottom-right' />
			</QueryClientProvider>
		</Provider>
	);
};

export default MyApp;

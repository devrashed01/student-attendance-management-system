import { ConfigProvider, GlobalToken, theme, ThemeConfig } from 'antd';
import dayjs from 'dayjs';
import updateLocale from 'dayjs/plugin/updateLocale';
import React, { FC } from 'react';
import { ThemeProvider } from 'styled-components';
import { useStoreSelector } from '~/store';

interface Props {
	loading: React.ReactNode;
	children: React.ReactNode;
}

const ConfigurationsProvider: FC<Props> = ({ loading, children }: Props) => {
	const { primaryColor, darkMode, compactMode, isLoaded } = useStoreSelector((state) => state.app);
	const algorithm = [darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm];

	const themeConfig: ThemeConfig = {
		algorithm: compactMode ? [...algorithm, theme.compactAlgorithm] : algorithm,
		token: {
			colorPrimary: primaryColor,
			colorLink: primaryColor,
			fontFamily: 'Inter',
		},
	};

	dayjs.extend(updateLocale);
	dayjs.updateLocale('en', {
		weekStart: 1,
	});

	const globalToken = primaryColor ? theme.getDesignToken(themeConfig) : ({} as GlobalToken);

	if (isLoaded) return <>{loading}</>;

	return (
		<ConfigProvider theme={themeConfig}>
			<ThemeProvider theme={{ ...globalToken, mode: darkMode ? 'dark' : 'light' }}>
				{children}
			</ThemeProvider>
		</ConfigProvider>
	);
};

export default ConfigurationsProvider;

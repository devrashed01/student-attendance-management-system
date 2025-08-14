import { Col } from 'antd';
import { FC } from 'react';
import { Outlet } from 'react-router-dom';
import { withoutAuth } from '~/components/hoc';
import { BGWithImage, LoginWrapper, RowWrapper } from './styles';

const SignInLayout: FC = withoutAuth(() => {
	return (
		<RowWrapper align='middle' justify='center'>
			<Col xs={0} lg={12}>
				<BGWithImage />
			</Col>
			<Col xs={24} lg={12}>
				<LoginWrapper>
					<Outlet />
				</LoginWrapper>
			</Col>
		</RowWrapper>
	);
});

export default SignInLayout;

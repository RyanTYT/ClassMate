import React from 'react';
import { render } from '@testing-library/react';
import StatusBar from '@components/dashboard/dashboard/StatusBar';
import '@testing-library/jest-dom';

describe('StatusBar() component', () => {
    test('renders status bar with correct descriptor', () => {
        const color = '#404040';
        const height = '20px';
        const descriptor = 'Test Descriptor';

        const { getByText } = render(
            <StatusBar color={color} height={height} descriptor={descriptor} />
        );

        const descriptorElement = getByText(descriptor);
        expect(descriptorElement).toBeInTheDocument();
    });

    test('calculates the width correctly based on the descriptor length', () => {
        const color = '#404040';
        const height = '20px';
        const descriptor = 'Test Descriptor sdjknjdnkadnsnkjnasfnn';

        const { container } = render(
            <StatusBar color={color} height={height} descriptor={descriptor} />
        );

        const wrapperElement = container.firstChild;
        const backgroundElement = container.firstChild?.firstChild;

        // Check if the width is dynamically calculated based on the descriptor length
        expect(wrapperElement).toHaveStyle({ width: '47px' }); // Expected width: (descriptor length + 25)px + 5px for padding
        expect(backgroundElement).toHaveStyle({ width: '42px' }); // Expected width: descriptor length + 5px for padding
    });
});

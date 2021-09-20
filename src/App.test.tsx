import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { myAPI } from './mock/myAPI';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});

test('open files when button clicked', async () => {
  myAPI.openDialog.mockResolvedValue(['file1.txt', 'file2.txt']);
  render(<App />);

  const button = screen.getByTestId('open-dialog');
  expect(button).toBeInTheDocument();
  expect(button.innerHTML).toBe('open dialog');

  expect(button).toBeEnabled();
  fireEvent.click(button);
  expect(button).toBeDisabled();

  await waitFor(() => screen.getByTestId('file0'));

  expect(myAPI.openDialog).toHaveBeenCalled();

  expect(screen.getByTestId('file0')).toHaveTextContent('file1.txt');
  expect(screen.getByTestId('file1')).toHaveTextContent('file2.txt');
  expect(screen.queryByTestId('file2')).toBeNull();
});
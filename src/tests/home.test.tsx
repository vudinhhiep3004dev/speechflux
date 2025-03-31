import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

describe('Home Page', () => {
  it('renders the SpeechFlux title', () => {
    render(<Home />);
    const title = screen.getByText('SpeechFlux');
    expect(title).toBeInTheDocument();
  });

  it('renders the main description', () => {
    render(<Home />);
    const description = screen.getByText(/Convert speech to text, translate, and summarize/i);
    expect(description).toBeInTheDocument();
  });

  it('renders the get started button', () => {
    render(<Home />);
    const button = screen.getByText('Get Started');
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe('A');
    expect(button).toHaveAttribute('href', '/dashboard');
  });

  it('renders the view pricing button', () => {
    render(<Home />);
    const button = screen.getByText('View Pricing');
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe('A');
    expect(button).toHaveAttribute('href', '/pricing');
  });

  it('renders all feature cards', () => {
    render(<Home />);
    const speechToText = screen.getByText('Speech-to-Text');
    const translation = screen.getByText('Translation');
    const summarization = screen.getByText('Summarization');
    
    expect(speechToText).toBeInTheDocument();
    expect(translation).toBeInTheDocument();
    expect(summarization).toBeInTheDocument();
  });
}); 
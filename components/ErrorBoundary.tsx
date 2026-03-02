/**
 * Error boundary — catches React errors and shows a fallback UI.
 */
import React, { Component, type ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useIconColors } from '@/lib/iconTheme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (__DEV__) {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <ErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }
    return this.props.children;
  }
}

function ErrorFallback({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const iconColors = useIconColors();
  return (
    <View className="flex-1 bg-background items-center justify-center p-8">
      <Text className="text-6xl mb-4">😅</Text>
      <Text className="text-xl font-bold text-foreground text-center mb-2">
        Something went wrong
      </Text>
      <Text className="text-sm text-muted-foreground text-center mb-6">
        {__DEV__ ? error.message : 'We hit a snag. Try again.'}
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        className="bg-primary px-8 py-3 rounded-xl"
      >
        <Text className="text-primary-foreground font-semibold">Try again</Text>
      </TouchableOpacity>
    </View>
  );
}

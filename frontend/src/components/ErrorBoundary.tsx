import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Global Error Boundary component that catches JavaScript errors anywhere
 * in the child component tree and displays a fallback UI.
 */
class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log error to console for debugging
        console.error('ErrorBoundary caught an error:', error);
        console.error('Component stack:', errorInfo.componentStack);

        this.setState({ errorInfo });

        // You can also log to an error reporting service here
        // logErrorToService(error, errorInfo);
    }

    handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleGoHome = (): void => {
        // Reset the error state and navigate to home
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
        window.location.href = '/login';
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Custom fallback UI if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="min-h-screen bg-background flex items-center justify-center p-4">
                    <Card className="max-w-lg w-full p-8 space-y-6">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                                <AlertTriangle className="w-8 h-8 text-destructive" />
                            </div>

                            <div className="space-y-2">
                                <h1 className="text-2xl font-bold text-foreground">
                                    Something went wrong
                                </h1>
                                <p className="text-muted-foreground">
                                    An unexpected error occurred. We apologize for the inconvenience.
                                </p>
                            </div>

                            {/* Error details (shown in development) */}
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <div className="w-full mt-4 p-4 bg-muted rounded-lg text-left overflow-auto max-h-48">
                                    <p className="text-sm font-mono text-destructive">
                                        {this.state.error.toString()}
                                    </p>
                                    {this.state.errorInfo && (
                                        <pre className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    )}
                                </div>
                            )}

                            {/* Recovery actions */}
                            <div className="flex flex-col sm:flex-row gap-3 w-full mt-4">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={this.handleReset}
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Try Again
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={this.handleGoHome}
                                >
                                    <Home className="w-4 h-4 mr-2" />
                                    Go to Home
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

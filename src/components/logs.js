import React from 'react';
import Sandbox from 'sandboxjs';

import Alert from '../components/alert';

import '../styles/logs.less';

export default class A0Logs extends React.Component {
    constructor(props) {
        super(props);

        this.logStream = null;
        this.state = {
            error: null,
            logs: []
        };
    }

    componentDidMount() {
        this.logStream = this.props.profile.createLogStream();

        this.logStream.on('error', (e) => {
            console.error(e);

            this.setState({
                error: new Error(e.message),
            });
            
            if (this.props.onError) this.props.onError(e);
        });

        this.logStream.on('data', (event) => {
            const logs = this.state.logs.slice();

            if (event.name === 'sandbox-logs') {
                logs.push(event);
                logs.sort((a, b) => new Date(b) - new Date(a));

                this.setState({ logs });
                
                if (this.props.onMessage) this.props.onMessage(event.msg);
            }
            
            if (this.props.onEvent) this.props.onEvent(event);
        });
    }

    componentDidUpdate() {
        if(this.refs['log-view']) {
            let logs = this.refs['log-view'];

            logs.scrollTop = logs.scrollHeight;
        }
    }
    
    componentWillUnmount() {
        this.logStream.destroy();
        this.logStream = null;
    }

    render() {
        const error = this.state.error
            ? 'Error: ' + this.state.error.message
            : null;

        const logs = this.state.logs.length
        ?   (
                <pre className="well pre-scrollable" ref="log-view">
                    {
                        this.state.logs.map(line => line.msg + '\n')
                    }
                </pre>
            )
        :   (
                <Alert bsStyle="info">
                    Nothing to report
                </Alert>
            );

        return (
            <div className="a0-logs">
                {
                    this.state.logs.map(line => line.msg + '\n')
                }
            </div>
        );
    }
    
    clear() {
        this.setState({
            logs: [],
        });
    }
}

A0Logs.title = 'View webtask logs';

A0Logs.propTypes = {
    profile: React.PropTypes.instanceOf(Sandbox).isRequired,
    onMessage: React.PropTypes.func,
    onEvent: React.PropTypes.func,
    onError: React.PropTypes.func,
};

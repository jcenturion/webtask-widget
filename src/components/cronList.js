import React from 'react';
import Sandbox from 'sandboxjs';

import ComponentStack from '../lib/componentStack';

import Button from '../components/button';


export default class A0CronJobs extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            error: null,
            loadingJobs: false,
            jobs: [],
        };
    }
    
    componentDidMount() {
        this.refreshJobs();
    }
    
    render() {
        const props = this.props;
        const state = this.state;
        
        const loading = state.loadingJobs;
        const createJob = this.createJob.bind(this);
        const refreshJobs = this.refreshJobs.bind(this);
        const viewJob = job => e => this.viewJob(e, job);
        
        const loadingBody = (
            <tbody className="a0-conlist-loading">
                <tr>
                    <td className="a0-cronlist-colspan" colspan="99">Loading cron jobs...</td>
                </tr>
            </tbody>
        );
        
        return (
            <div className="a0-cronlist">
                { state.error
                ?   (
                        <Alert bsStyle="danger">
                            { state.error.message }
                        </Alert>
                    )
                :   null
                }
                <table className="table table-hover">
                    <thead>
                        <th>Job name</th>
                        <th>Created at</th>
                        <th>Next run</th>
                        <th>State</th>
                        <th>Last result</th>
                    </thead>
                    { loading
                    ?   loadingBody
                    :   (
                            <tbody>
                                { state.jobs && state.jobs.length
                                ?   state.jobs.map((job) => <JobRow key={ job.name } job={ job } onClick={ viewJob(job) } />)
                                :   (
                                        <tr className="a0-cronlist-empty">
                                            <td className="a0-cronlist-colspan" collSpan="99">
                                                No jobs found.
                                                
                                                <Button
                                                    bsStyle="link"
                                                    bsSize="sm"
                                                    onClick={ refreshJobs }
                                                >Refresh</Button>
                                            </td>
                                        </tr>
                                    )
                                }
                            </tbody>
                        )
                    }
                </table>
                { props.showCreateButton
                ?   (
                        <Button
                            bsStyle="primary"
                            block
                            onClick={ createJob }
                        >Create</Button>
                    )
                : null
                }
            </div>
        );
    }
    
    createJob(e) {
        if (e) e.preventDefault();
        
        // this.props.componentStack.push();
        
        alert('WIP: createJob()');
    }
    
    refreshJobs(e) {
        if (e) e.preventDefault();
        
        this.setState({ loadingJobs: true, jobs: [], error: null });
        
        this.props.profile.listCronJobs()
            .then((jobs) => this.setState({ jobs }))
            .catch((error) => this.setState({ error }))
            .finally(() => this.setState({ loadingJobs: false }));
    }
    
    viewJob(e, job) {
        if (e) e.preventDefault();
        
        alert(`WIP: viewJob('${job.name}')`);
    }
}

A0CronJobs.propTypes = {
    componentStack:         React.PropTypes.instanceOf(ComponentStack).isRequired,
    profile:                React.PropTypes.instanceOf(Sandbox).isRequired,
    showCreateButton:       React.PropTypes.bool,
};

A0CronJobs.defaultProps = {
    showCreateButton:       true,
};

class JobRow extends React.Component {
    render() {
        const props = this.props;
        
        const job = props.job;
        const resultClasses = {
            success: 'label-success',
            error: 'label-danger',
        };
        const stateClasses = {
            active: 'label-success',
            invalid: 'label-danger',
            expired: 'label-warning',
        };
        const lastResult = job.results.length
        ?   job.results[0]
        :   null;
        
        return (
            <tr onClick={ props.onClick }>
                <td>{ job.name }</td>
                <td>{ new Date(job.created_at).toLocaleString() }</td>
                <td>{ new Date(job.last_scheduled_at || job.next_available_at).toLocaleString() }</td>
                <td>
                    <span className={ `label ${stateClasses[job.state]}` }>{ job.state }</span>
                </td>
                <td>
                    { lastResult
                    ?   (
                            <div>
                                <span className={ `label ${resultClasses[lastResult.type]}` }>{ lastResult.type }</span>
                                <span>{ new Date(lastResult.started_at).toLocaleString() }</span>
                            </div>
                        )
                    : null
                    }
                </td>
            </tr>
        );
    }
}
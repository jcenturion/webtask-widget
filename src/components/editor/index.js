import Genid from 'genid';
import React from 'react';
import Sandbox from 'sandboxjs';

import { CreateCronJobStrategy, CreateWebtaskStrategy, EditCronJobStrategy, EditWebtaskStrategy } from './strategies';

import PaneSelector from './paneSelector';
import WebtaskUrl from './webtaskUrl';


import 'styles/editor.less';


export default class WebtaskEditor extends React.Component {
    constructor(props) {
        super(props);
        
        this.strategy = this.props.cron
            ?   this.props.edit
                ?   EditCronJobStrategy
                :   CreateCronJobStrategy
            :   this.props.edit
                ?   EditWebtaskStrategy
                :   CreateWebtaskStrategy;
        
        this.state = {
            code: this.props.code || this.strategy.defaultCode,
            currentPane: this.strategy.defaultPane,
            mergeBody: typeof this.props.mergeBody !== 'undefined'
                ?   this.props.mergeBody
                :   this.strategy.defaultMergeBody,
            name: props.name,
            parseBody: typeof this.props.parseBody !== 'undefined'
                ?   this.props.parseBody
                :   this.strategy.defaultParseBody,
            runInProgress: false,
            saveInProgress: false,
            schedule: props.schedule,
            secrets: props.secrets,
            subject: props.edit,
        };
        
    }
    
    render() {
        const editorBody = this.state.currentPane.renderBody.call(this);
        const urlInfo = this.strategy.getUrlInfo(this.props.sandbox);
        
        const error = this.state.error
            ?   (
                    <div className="a0-error-message"
                        onClick={ e => this.onClickError() }
                    >
                        { this.state.error.message }
                    </div>
                )
            :   null;
        
        const paneSelector = (
            <PaneSelector
                currentPane={ this.state.currentPane }
                panes={ this.strategy.panes }
                onChange={ pane => this.onChangePane(pane) }
            />
        );
        
        const runButton = (
            <button className="a0-inline-button -success"
                disabled={ this.state.runInProgress }
                onClick={ e => this.onClickRun() }
            >Run</button>
        );
        
        const saveButton = (
            <button className="a0-inline-button -primary"
                disabled={ this.state.saveInProgress }
                onClick={ e => this.onClickSave() }
            >Save</button>
        );
        
        const sidebarBody = this.strategy.panes.map(pane => (
            <div key={ pane.name } className={ 'a0-sidebar-pane ' + (pane === this.state.currentPane ? '-active' : '') }>
                { pane.renderSidebar.call(this) }
            </div>
        ));

        const webtaskUrl = (
            <WebtaskUrl
                copyButton={ urlInfo.copyButton }
                disabled={ this.state.saveInProgress }
                name={ this.state.name }
                onChangeName={ name => this.setState({ name }) }
                prefix={ urlInfo.prefix }
                readonly={ urlInfo.readonly }
            />
        );
        
        return (
            <div className="a0-editor">
                <div className="a0-editor-split">
                    <div className="a0-editor-left">
                        <div className="a0-editor-toolbar">
                            { this.props.backButton }
                        </div>
                        <div className="a0-editor-body">
                            { error }
                            { editorBody }
                        </div>
                    </div>
                    <div className="a0-editor-right">
                        <div className="a0-editor-toolbar">
                            { paneSelector }
                        </div>
                        <div className="a0-editor-sidebar">
                            { sidebarBody }
                        </div>
                    </div>
                </div>
                <div className="a0-editor-footer">
                    <div className="a0-webtask-url">
                        { webtaskUrl }
                    </div>
                    <div className="a0-footer-actions">
                        { saveButton }
                        { runButton }
                    </div>
                </div>
            </div>
        );
    }
    
    getJobState() {
        return this.strategy.getJobState.call(this);
    }
    
    onChangeCode(code) {
        this.setState({ code });
    }
    
    onChangeOptions(options) {
        console.log('onChangeOptions', options);
        this.setState(options);
    }
    
    onChangePane(pane) {
        this.setState({ currentPane: pane });
    }
    
    onChangeSchedule(schedule) {
        this.setState({ schedule });
    }
    
    onChangeSecrets(secrets) {
        this.setState({ secrets });
    }
    
    onChangeState(state) {
        this.strategy.onChangeState.call(this, state);
    }
    
    onClickRun() {
        this.setState({ runInProgress: true });
                    
        this.strategy.panes.forEach(pane => pane.name === 'Logs'
            && this.setState({ currentPane: pane })
        );
        
        const webtaskOptions = {
            name: this.state.name + '-run',
            mergeBody: this.state.mergeBody,
            parseBody: this.state.parseBody,
            secrets: this.state.secrets,
        };
        
        this.props.sandbox.create(this.state.code, webtaskOptions)
            .then(webtask => webtask.run({
                method: 'get',
                query: {
                    webtask_no_cache: 1,
                },
            }))
            .tap((res) => {
                const headers = res.header;
                const auth0HeaderRx = /^x-auth0/;

                for (let header in headers) {
                    if (auth0HeaderRx.test(header)) {
                        headers[header] = JSON.parse(headers[header]);
                    }
                }
                
                if (this.refs.logs) {
                    this.refs.logs.push({
                        data: {
                            headers: headers,
                            statusCode: res.status,
                            body: res.body || res.text,
                        },
                    });
                }
            })
            .catch(error => this.setState({ error }))
            .finally(() => this.setState({ runInProgress: false }));
    }
    
    onClickSave() {
        const error = this.validate();
        
        if (error) {
            return this.setState({ error });
        }
        
        this.setState({ saveInProgress: true });
        
        this.strategy.onSave.call(this)
            .catch(error => this.setState({ error }))
            .finally(() => this.setState({ saveInProgress: false }));
    }
    
    onSelectHistoryItem(item) {
        this.setState({ selectedHistoryItem: item });
    }
    
    setStrategy(strategy) {
        if (this.strategy.onDeactivate) {
            this.strategy.onDeactivate();
        }
        
        this.strategy = strategy;
        
        if (this.strategy.onActivate) {
            this.strategy.onActivate();
        }
        
        this.forceUpdate();
    }
    
    validate() {
        const name = this.state.name.trim();
        
        if (!name.match(/^[-_\.a-zA-Z0-9]{1,32}$/)) {
            return new Error('Invalid name: Webtask names must contain between 1 and 32 alphanumeric characters.');
        }
    }
}

WebtaskEditor.propTypes = {
    backButton: React.PropTypes.node,
    code: React.PropTypes.string,
    cron: React.PropTypes.bool,
    edit: React.PropTypes.oneOfType([
        React.PropTypes.instanceOf(Sandbox.CronJob),
        React.PropTypes.instanceOf(Sandbox.Webtask),
    ]),
    name: React.PropTypes.string,
    pane: React.PropTypes.string,
    sandbox: React.PropTypes.instanceOf(Sandbox).isRequired,
    saveButton: React.PropTypes.node,
    schedule: React.PropTypes.string,
    secrets: React.PropTypes.object,
};

WebtaskEditor.defaultProps = {
    cron: false,
    name: Genid(10),
    schedule: '',
    secrets: {},
};
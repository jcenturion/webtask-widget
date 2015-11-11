import Debounce from 'lodash.debounce';
import React from 'react';
import Sandbox from 'sandboxjs';

import {Modal} from 'react-bootstrap';
import ReactZeroClipboard from 'react-zeroclipboard';

import AceEditor from '../components/ace';
import AdvancedEditorOptions from '../components/advancedEditorOptions';
import Alert from '../components/alert';
import Button from '../components/button';
import Input from '../components/input';
import Logs from '../components/logs';
import ScheduleEditor from '../components/scheduleEditor';
import SecretsEditor from '../components/secretsEditor';
import TryWebtask from '../components/tryWebtask';

import ComponentStack from '../lib/componentStack';
import dedent from '../lib/dedent';


import '../styles/editor.less';

export default class A0Editor extends React.Component {
    constructor(props) {
        super(props);
        
        this.state = {
            schedule: props.schedule,
            code: props.code,
            secrets: props.secrets,
            creatingToken: false,
            showAdvanced: false,
            savingWebtask: false,
            mergeBody: props.mergeBody,
            parseBody: props.parseBody,
            name: props.name,
            successMessage: '',
            pane: 'Logs',
        };

        const debounceInterval = Math.max(1000, Number(props.autoSaveInterval));

        this.autoSave = Debounce(() => this.saveWebtask(), debounceInterval);
    }
    
    render() {
        const props = this.props;
        const state = this.state;
        
        const loading = state.creatingToken
            || state.savingWebtask;
        const onChangeCode = this.onChangeCode.bind(this);
        const onChangeAdvancedOptions = this.onChangeAdvancedOptions.bind(this);
        const saveWebtask = this.saveWebtask.bind(this);
        const setState = this.setState.bind(this);
        const toggleSecrets = this.toggleSecrets.bind(this);
        const tryWebtask = this.tryWebtask.bind(this);
        const onChangeSchedule = this.onChangeSchedule.bind(this);
        const getSecrets = () => this.refs.secrets.getValue();
        
        const copyButton = this.state.webtask
            ?   (
                    <ReactZeroClipboard text={ state.webtask.url }>
                        <Button>Copy</Button>
                    </ReactZeroClipboard>
                )
            :   null;
        
        const panes = [
            {
                name: 'Secrets',
                iconClass: '--key',
                vdom: (
                    <SecretsEditor
                        ref="secrets"
                        secrets={ state.secrets }
                        onChange={ () => setState({
                            secrets: getSecrets()
                        }) }
                    />
                ),
            },
            {
                name: 'Schedule',
                iconClass: '--clock',
                vdom: (
                    <SecretsEditor
                        ref="secrets"
                        secrets={ state.secrets }
                        onChange={ () => setState({
                            secrets: getSecrets()
                        }) }
                    />
                ),
            },
            {
                name: 'Settings',
                iconClass: '--gear',
                vdom: (
                    <SecretsEditor
                        ref="secrets"
                        secrets={ state.secrets }
                        onChange={ () => setState({
                            secrets: getSecrets()
                        }) }
                    />
                ),
            },
            {
                name: 'Logs',
                iconClass: '--split',
                vdom: (
                    <Logs className="a0-editor-logs" profile={ props.profile } />
                ),
            },
        ];

        return (
            <div className="a0-editor">
                <div className="a0-editor-split">
                    <div className="a0-editor-left">
                        <div className="a0-editor-toolbar">
                        </div>
                        <div className="a0-editor-body">
                            <AceEditor
                                ref="ace"
                                name="code"
                                className="a0-editor-ace"
                                mode="javascript"
                                theme="textmate"
                                value={ state.code }
                                maxLines={ 15 }
                                minLines={ 5 }
                                height=""
                                width=""
                                onChange={ onChangeCode }
                                highlightActiveLine={ false }
                                editorProps={ { $blockScrolling: true } }
                            />
                        </div>
                    </div>
                    <div className="a0-editor-right">
                        <div className="a0-editor-toolbar">
                            {
                                panes.map((pane) => {
                                    const classNames = ['a0-icon-button', '--icon', pane.iconClass];
                                    
                                    if (pane.name === state.pane) classNames.push('--arrow-below');
                                
                                    return <button
                                        className={ classNames.join(' ') }
                                        onClick={ () => setState({ pane: pane.name }) }
                                    >{ pane.name }</button>;
                                })
                            }
                        </div>
                        <div className="a0-editor-sidebar">
                            {
                                panes
                                    .filter(pane => pane.name === state.pane)
                                    .map(pane => pane.vdom)
                            }
                        </div>
                    </div>
                </div>
                <div className="a0-editor-footer">
                    <div className="a0-webtask-url">
                        <span className="a0-container-url">
                            { props.profile.url + '/api/run/' + props.profile.container + '/' }
                        </span>
                        <input className="a0-name-input"
                        />
                        <button className="a0-icon-button --icon --copy"></button>
                    </div>
                    <div className="a0-footer-actions">
                        <button className="a0-inline-button --primary">Save</button>
                        <button className="a0-inline-button --success">Run</button>
                    </div>
                </div>
                { state.error
                ?   (
                        <Alert bsStyle="danger">
                            { state.error.message }
                        </Alert>
                    )
                :   null
                }
                
                <div className="form-group form-group-grow">
                    <label className="control-label">Edit webtask code:</label>
                </div>
                
                { state.showAdvanced
                ?   (
                        <AdvancedEditorOptions
                            ref="advancedOptions"
                            name={ props.name }
                            mergeBody={ props.mergeBody }
                            parseBody={ props.parseBody }
                            secrets={ props.secrets }
                            loading={ loading }
                            onChange={ onChangeAdvancedOptions }
                        />
                    )
                :   null
                }
                
                { props.showScheduleInput
                ?   (
                        <ScheduleEditor
                            ref="schedule"
                            type="text"
                            label="Schedule:"
                            help={[
                                'The schedule must be a valid ',
                                <a key="schedule-help-link" href="http://crontab.guru/" target="_blank">cron expression</a>,
                                '.',
                            ]}
                            value={ state.schedule }
                            onChange={ onChangeSchedule }
                        />
                    )
                :   null
                }

                { state.webtask
                ?   (
                        <div>
                            { state.successMessage
                            ?   (
                                    <Alert
                                        bsStyle="success"
                                        onDismiss={ () => setState({ successMessage: '' }) }
                                        dismissAfter={ 2000 }
                                        >
                                        { state.successMessage }
                                    </Alert>
                                )
                            :   null
                            }
    
                            { props.showWebtaskUrl
                            ?   (
                                    <Input
                                        type="text"
                                        disabled
                                        label="Webtask url:"
                                        buttonAfter={ copyButton }
                                        value={ state.webtask.url }
                                    />
                                )
                            :   null
                            }
    
                        </div>
                    )
                :   null
                }
                
                <div className="btn-list">
                    <Button
                        bsStyle="link"
                        className="pull-left"
                        type="button"
                        disabled={ loading }
                        onClick={ loading ? null : toggleSecrets }
                    >
                        { state.showAdvanced ? 'Hide advanced' : 'Show advanced' }
                    </Button>

                    <Button
                        type="submit"
                        disabled={ loading }
                        onClick={ loading ? null : tryWebtask }
                    >
                        { state.creatingToken ? 'Sending...' : 'Try'}
                    </Button>

                    <Button
                        bsStyle="primary"
                        type="submit"
                        disabled={ loading }
                        onClick={ loading ? null : saveWebtask }
                    >
                        { state.savingWebtask ? 'Deploying...' : 'Deploy' }
                    </Button>
                </div>
            </div>
        );
    }
    
    onChangeAdvancedOptions({ name, mergeBody, parseBody, secrets }) {
        this.setState({ name, mergeBody, parseBody, secrets });
    }
    
    onChangeCode(code) {
        this.setState({ code });
    }
    
    onChangeSchedule(schedule) {
        this.setState({ schedule: this.refs.schedule.getValue() });
    }
    
    saveWebtask ({hideSuccessMessage = false} = {}) {
        // Cancel any pending autoSaves
        this.autoSave.cancel();

        this.setState({
            savingWebtask: true,
            successMessage: '',
        });
        
        let promise = this.props.profile.create(this.state.code, {
            merge: this.state.mergeBody,
            parse: this.state.parseBody,
            secret: this.state.secrets,
            name: this.state.name,
        });
        
        if (this.props.onSave) {
            promise = promise
                .tap(this.props.onSave);
        }
        
        promise = promise
            .tap(() => !hideSuccessMessage && this.setState({
                successMessage: 'Webtask successfully created',
            }))
            .tap((webtask) => this.setState({
                webtask,
            }))
            .finally(() => this.setState({ savingWebtask: false }));
        
        return promise;
    }
    
    toggleSecrets(e) {
        e.preventDefault();
        
        this.setState({
            showAdvanced: !this.state.showAdvanced
        });
    }
    
    tryWebtask(e) {
        e.preventDefault();
        
        const tryWebtaskProps = {
            profile: this.props.profile,
            name: this.state.name,
            mergeBody: this.state.mergeBody,
            parseBody: this.state.parseBody,
            secrets: this.state.secrets,
            code: this.state.code,
            tryParams: this.props.tryParams,
        };
        
        this.props.componentStack.push(TryWebtask, tryWebtaskProps);
    }
}

A0Editor.title = 'Create a webtask';

A0Editor.propTypes = {
    componentStack:         React.PropTypes.instanceOf(ComponentStack).isRequired,
    profile:                React.PropTypes.instanceOf(Sandbox).isRequired,
    name:                   React.PropTypes.string,
    mergeBody:              React.PropTypes.bool,
    parseBody:              React.PropTypes.bool,
    autoSaveInterval:       React.PropTypes.number,
    autoSaveOnChange:       React.PropTypes.bool,
    autoSaveOnLoad:         React.PropTypes.bool,
    showWebtaskUrl:         React.PropTypes.bool,
    showTryWebtaskUrl:      React.PropTypes.bool,
    showScheduleInput:      React.PropTypes.bool,
    schedule:               React.PropTypes.string,
    secrets:                React.PropTypes.object,
    code:                   React.PropTypes.string,
    tryParams:              React.PropTypes.object,
    onSave:                 React.PropTypes.func,
};

A0Editor.defaultProps = {
    mergeBody:              false,
    parseBody:              false,
    name:                   '',
    autoSaveInterval:       1000,
    autoSaveOnChange:       false,
    autoSaveOnLoad:         false,
    showWebtaskUrl:         true,
    showTryWebtaskUrl:      true,
    showScheduleInput:      false,
    schedule:               '* * * * *',
    secrets:                {},
    code:                   dedent`
                                module.exports = function (ctx, cb) {
                                    cb(null, 'Hello ' + ctx.query.hello);
                                };
                            `.trim(),
    tryParams:              {
                                path: '',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                query: {
                                    hello: 'world',
                                },
                                body: {
                                    hint: 'Only sent for PUT, POST and PATCH requests',
                                },
                            },
};

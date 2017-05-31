var format = require('string-format');
var React = require('react');
var Reflux = require('reflux');
var classSet = require('react-classset');
var c3 = require('c3');
var _ = require('lodash');
var moment = require('moment');
var ApiConsumerMixin = require('mozaik/browser').Mixin.ApiConsumer;
class TimeseriesChart {
    constructor(bindTo, opts) {
        opts = opts || {};
        this.chart = c3.generate({
            bindto: bindTo,
            data: {
                labels: true,
                x: 'x',
                columns: []
            },
            axis: {
                x: {
                    type: 'categorized',
                }
            }
        });
    }
    load(data) {
        return this.chart.load(data);
    }
    loadEntries(results) {
        var xData = [];
        var visitsData = [];
        if (!results || results.length === 0) {
            console.warn('No statistics provided');
            return;
        }
        _.each(results, function(result) {
            xData.push(result.name);
            visitsData.push(result.velocity);
        });
        return this.load({
            columns: [
                ['x'].concat(xData),
                ['Sprint Points'].concat(visitsData)
            ]
        });
    }
};
var PageViews = React.createClass({
    chartClassName: 'chart',
    chart: null,
    mixins: [
        Reflux.ListenerMixin,
        ApiConsumerMixin
    ],
    propTypes: {
        usr:      React.PropTypes.string.isRequired,
        pwd:      React.PropTypes.string.isRequired,
        boardID:  React.PropTypes.string.isRequired
    },
    getInitialState() {
        return {
            total: null,
            avg: null,
            entries: []
        }
    },
    componentDidMount() {
        var chartElement = this.getDOMNode().getElementsByClassName(this.chartClassName)[0];
        this.chart = new TimeseriesChart(chartElement, {
            min: this.props.min,
            max: this.props.max,
            tickCount: this.props.tickCount,
            dateFormat: this.props.dateFormat
        });
    },
    componentWillUnmount() {
        if (this.chart) {
            this.chart.destroy();
        }
    },
    getApiRequest() {
        let { usr, pwd, boardID } = this.props;
        return {
            id:     `jira.sprints.${ usr }.${ pwd }.${ boardID }`,
            params: {
                usr:      usr,
                pwd:      pwd,
                boardID:  boardID
            }
        };
    },
    onApiData(data) {
        this.setState({ results: _.clone(results) });
        this.chart.loadEntries(this.state.results);
    },
    render() {
        let { usr,pwd,boardID } = this.props;
        let { results }            = this.state;
       /* var title = this.props.title || 'Analytics';
        var avg = this.state.avg || '-';
        var total = this.state.total || '-';*/
        var widget = (
            <div>
                <div className="widget__header">

         /* <span className="widget__header__count">
            <span className="label">avg</span>
            <span className="value">{avg}</span>
            <span className="delimeter">/</span>
            <span className="label">total</span>
            <span className="value">{total}</span>
          </span>*/
                    <i className="fa fa-line-chart" />
                </div>
                <div className="widget__body">
                    <div className={this.chartClassName}></div>
                </div>
            </div>
        );
        return widget;
    }
});
module.exports = PageViews;

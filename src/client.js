var request = require('superagent-bluebird-promise');
var _ = require('lodash');
var Promise = require('bluebird');
var config = require('./config');
var moment = require('moment');
/**
 * @param {Mozaik} mozaik
 */
const client = mozaik => {
  mozaik.loadApiConfig(config);
  const workday_count = (start,end) =>{
    var first = start.clone().endOf('week'); // end of first week
    var last = end.clone().startOf('week'); // start of last week
    var days = last.diff(first,'days') * 5 / 7; // this will always multiply of 7
    var wfirst = first.day() - start.day(); // check first week
    if(start.day() == 0)
      --wfirst; // -1 if start with sunday
    var wlast = end.day() - last.day(); // check last week
    if(end.day() == 6)
      --wlast; // -1 if end with saturday
    return wfirst + days + wlast; // get the total
  };
  const buildApiRequest = (path, params) =>{
    var basic_url = config.get('jira.host')+'rest/agile/';
    var api_version = 'latest';
    var urlStr = basic_url + api_version + '/'+path + '?maxResults=250';
    var req = request.get(urlStr).auth(config.get('jira.username'), config.get('jira.password'));
    mozaik.logger.info('request sent to jira is :' + urlStr);
    return req.promise();
  };
  const calculateDate = (d, diffs) =>{
    var ref = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var result = new Date(ref.setDate(d.getDate()- diffs));
    return result;
  };
  const generateXLegend = (d1, d2) =>{
    var name = (d1.getMonth() + 1)+'.' + d1.getDate() + '-' + (d2.getMonth() + 1) + '.' + d2.getDate();
    return name;
  };
  const generateKanbanIssue = (bname, lDate, rDate) =>{
    var resObj = {};
    resObj['name'] = generateXLegend(lDate, rDate);
    resObj['velocity'] = 0;
    resObj['sLength'] = 5;
    resObj['boardName'] = bname;
    return resObj;
  };
  const getVelocity = (res, params) =>{
    var rObj = {};
    var spCompleted = 0;
    var bugCompleted = 0;
    //console.log(res.body.issues.length);

    for(var i = 0; i<res.body.issues.length;i++){
      var num = res.body.issues[i].fields;
      if(typeof num.customfield_10006 !== 'undefined' && num.customfield_10006 !== null && num.status.name === "Done"){
        if (num.issuetype.name === 'Bug'){
          bugCompleted += num.customfield_10006;

        }
        spCompleted += num.customfield_10006;

      }
    }
    console.log('story points completed: '+ spCompleted);
    console.log('bug completed: '+ bugCompleted);
    rObj['id'] = params.sprintID;
    rObj['name'] = params.sprintName;
    rObj['velocity'] = spCompleted;
    rObj['boardName'] = params.boardName;
    rObj['sLength'] = params.sprintLth;
    rObj['bugIssue'] = bugCompleted;
    ///params.sprintLth;
    console.log(rObj);
    return rObj;
  };
  const getBurnDown = (res) =>{
    var burnDownObj = [];
    var singleObj = {};
    var totalPoints = 0;
    for(var i = 0; i<res.body.issues.length; i++){
      var fields = res.body.issues[i].fields;
      if(typeof fields.customfield_10006 !== 'undefined'){
        totalPoints += fields.customfield_10006;
        if(fields.status.name === "Done"){
          singleObj['id'] = res.body.issues[i].id;
          singleObj['resolutionDate'] = new Date(Date.parse(fields.resolutiondate));
          singleObj['storyPoints'] = fields.customfield_10006;
          burnDownObj.push(singleObj);
          console.log(singleObj);
          singleObj = {};
        }
      }
    }
    burnDownObj.sort(function(a, b){
      var date1 = new Date(a.resolutionDate);
      var date2 = new Date(b.resolutionDate);
      return date1 - date2;
    });
    console.log(burnDownObj);
    return burnDownObj;
  };
  const apiCalls = {
    board(params){
      return buildApiRequest(`board/${ params.boardID }`)
        .then(function(res){
          mozaik.logger.info("the type of board "+params.boardID +" is:"+ res.body.type);
          if(res.body.type === "kanban"){
            return apiCalls.kanban(_.extend({ boardName: res.body.name }, params));
          }else{
            return apiCalls.sprints(_.extend({ boardName: res.body.name }, params));
          }

        });
    },
    kanban(params){
      return buildApiRequest(`board/${ params.boardID }/issue`)
        .then(function(res){

          //calculate date boundaries.
          var now = new Date();
          var t = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          var lastSunday = new Date(t.setDate(t.getDate()-t.getDay()));
          console.log(lastSunday);
          var lastMonday = calculateDate(lastSunday, 6);
          var llastSunday = calculateDate(lastSunday, 7);
          var llastMonday = calculateDate(lastMonday, 7);
          var lllastSunday = calculateDate(llastSunday, 7);
          var lllastMonday = calculateDate(llastMonday, 7);
          var results = [];
          //normalize issue objects
          var dObj = generateKanbanIssue(params.boardName, lastMonday, lastSunday);
          console.log(dObj);
          var dObj2 = generateKanbanIssue(params.boardName, lllastMonday, llastSunday);
          console.log(dObj2);
          var dObj3 = generateKanbanIssue(params.boardName, lllastMonday, lllastSunday);
          console.log(dObj3);
          var resolutions = res.body.issues.map(function(item){
            if(item.resolutiondate === null){
            }else{
              var completionDate = new Date(Date.parse(item.resolutiondate));
              if(completionDate >= lastMonday && completionDate <= lastSunday){
                dObj.velocity += 1;
              }else if(completionDate >= llastMonday && completionDate <= llastSunday){
                dObj2.velocity += 1;
              }else if(completionDate >= lllastMonday && completionDate <= lllastSunday){
                dObj3.velocity += 1;
              }
            }
          });
          results.push(dObj3);
          results.push(dObj2);
          results.push(dObj);
          console.log(results);
          return results;
        });
    },
    sprints(params){
      return buildApiRequest(`board/${ params.boardID }/sprint`)
        .then(function(res){
          var filterRes = [];
          var issues = res.body.values.map(function(sprint){
            if(sprint.state === "closed"){
              //this is only for test purpose
              //if(sprint.name === "Sprint 6"){
              filterRes.push(sprint);
              //}

            }
          });
          var lastNSprints = [];
          var counter = Number(params.numOfSprint) || 3;
          if(params.type === 'burndown'){
            counter = 1;
          }
          if(filterRes.length < counter){
            lastNSprints = filterRes.reverse();
          }
          while(counter > 0 && filterRes.length >= counter){
            var s = filterRes[filterRes.length-counter];
            lastNSprints.push(s);
            counter--;
          }
          console.log('number of sprints to be rendered: ' + lastNSprints.length);
          var filteredSprints = lastNSprints.map(function(item){
            var wd = 14;
            if (typeof item.endDate === 'undefined' && typeof item.completeDate === 'undefined'){
              console.log("this sprint is not completed.");
            }
            else{
              var start = new Date(Date.parse(item.startDate));
              var endDate = item.completeDate === 'undefined'? item.completeDate: item.completeDate;
              var end = new Date(Date.parse(endDate));
              wd = workday_count(moment(start), moment(end));
            }
            return apiCalls.issues(_.extend({ sprintID: item.id }, { sprintName: item.name }, { sprintLth: wd }, params));
          });
          return Promise.all(filteredSprints);
        });
    },
    issues(params){
      return buildApiRequest(`board/${ params.boardID }/sprint/${ params.sprintID }/issue`)
        .then(function(res){
          if(params.type === 'burndown'){
            return getBurnDown(res);
          }
          else{
            return getVelocity(res, params);
          }

        });
    }
  };
  return apiCalls;
};
export default client;

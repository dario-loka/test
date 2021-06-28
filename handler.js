'use strict';

//initialize counters
var commit_counter={}
var pr_counter={}

const request = require('sync-request');

const WEBHOOK_URL = process.env.WEBHOOK_URL;

module.exports.eddifygithubhandler = (event, context, callback) => {
  const body = JSON.parse(event.body);
  const event_type = event.headers['X-GitHub-Event'];
  
  console.log(event_type)
   
  if (event_type=='push'){
   
   const {repository, sender, head_commit} = body;
     
   // commit object 
   let commit = { 
    id: head_commit.id, 
    sender_name: sender.login,
    sender_id: sender.id , 
    n_commits: 0,
    repo_name: repository.name,
    repo_id: repository.id ,
    timestamp: head_commit.timestamp ,
    message: head_commit.message,
    added: head_commit.added,
    removed: head_commit.removed,
    modified: head_commit.modified
   }
     
   // commit counter 
   if (commit.sender_name in commit_counter) {
     commit_counter[commit.sender_name]=commit_counter[commit.sender_name]+1;
     commit.n_commits=commit_counter[commit.sender_name];
   } else {
     commit_counter[commit.sender_name]=1
     commit.n_commits=commit_counter[commit.sender_name];
   }   
   
   try {
     sendCommitToSlack(commit);
   } catch (err) {
     console.log(err);
     callback(err);
   }
  
   const response = {
     statusCode: 200,
     body: JSON.stringify({
       message: "Event processed"
     }),
   };
   
   callback(null, response);
   
  } else if (event_type=='pull_request') {
  
   const {pull_request,repository} = body;
   
   // PR object
   let pull_request_obj = {
    id: pull_request.id,
    username: pull_request.user.login,
    userid: pull_request.user.id,
    repo_name: repository.name,
    repo_id: repository.id,
    creation_timestamp : pull_request.created_at,
    update_timestamp : pull_request.updated_at,
    close_timestamp : pull_request.closed_at,
    merge_timestamp : pull_request.merged_at,
    title: pull_request.title,
    description : pull_request.body,
    n_pr: 0
   }
   
   // pr counter 
   if (pull_request_obj.username in pr_counter) {
     pr_counter[pull_request_obj.username]=pr_counter[upll_request_obj.username]+1;
     pull_request_obj.n_pr=commit_counter[ull_request_obj.username];
   } else {
     pr_counter[pull_request_obj.username]=1
     pull_request_obj.n_pr=pr_counter[pull_request_obj.username];
   }
  
   try {
     sendPRToSlack(pull_request_obj);
   } catch (err) {
     console.log(err);
     callback(err);
   }
   
   const response = {
     statusCode: 200,
     body: JSON.stringify({
       message: "Event processed"
     }),
   };
   
   callback(null, response);
   
  } else if (event_type=='issue_comment') {
  
    const {issue, comment,repository, sender} = body;
   
   // Comment object
   let issue_comment = {
    id: comment.id,
    username: sender.login,
    userid: sender.id,
    repo_name: repository.name,
    repo_id: repository.id,
    issue_title: issue.title,
    creation_timestamp : comment.created_at,
    update_timestamp : comment.updated_at,
    content: comment.body
   }
   
   try {
     sendIssueCommentToSlack(issue_comment);
   } catch (err) {
     console.log(err);
     callback(err);
   }
   
   const response = {
     statusCode: 200,
     body: JSON.stringify({
       message: "Event processed"
     }),
   };
   
   callback(null, response);
  
  } else if (event_type=='pull_request_review') {
  
    const {review,sender,repository,pull_request} = body;
   
   // PR Review object
   let pr_review = {
    id: review.id,
    username: sender.login,
    userid: sender.id,
    repo_name: repository.name,
    repo_id: repository.id,
    pr_id: pull_request.id,
    pr_title: pull_request.title,
    pr_number: pull_request.number,
    submission_timestamp : review.submitted_at,
   }
   
   try {
     sendPRReviewToSlack(pr_review);
   } catch (err) {
     console.log(err);
     callback(err);
   }
   
   const response = {
     statusCode: 200,
     body: JSON.stringify({
       message: "Event processed"
     }),
   };
   
   callback(null, response);
  
  } else if (event_type=='commit_comment') {
  
   const {comment,repository, sender} = body;
   
   // Commit_Comment object
   let commit_comment = {
    id: comment.id,
    username: sender.login,
    userid: sender.id,
    repo_name: repository.name,
    repo_id: repository.id,
    commit_id: comment.commit_id,
    creation_timestamp : comment.created_at,
    update_timestamp : comment.updated_at,
    content: comment.body
   }
   
   try {
     sendCommitCommentToSlack(commit_comment);
   } catch (err) {
     console.log(err);
     callback(err);
   }
   
   const response = {
     statusCode: 200,
     body: JSON.stringify({
       message: "Event processed"
     }),
   };
   
   callback(null, response);
  
  } else if (event_type=='pull_request_review_comment') {
  
   const {comment,repository, sender, pull_request} = body;
   
   // PR Review Comment object
   let pull_request_review_comment = {
    id: comment.id,
    username: sender.login,
    userid: sender.id,
    repo_name: repository.name,
    repo_id: repository.id,
    pr_id: pull_request.id,
    pr_title: pull_request.title,
    pr_number: pull_request.number,
    creation_timestamp : comment.created_at,
    update_timestamp : comment.updated_at,
    content: comment.body
   }
   
   try {
     sendPRReviewCommentToSlack(pull_request_review_comment);
   } catch (err) {
     console.log(err);
     callback(err);
   }
   
   const response = {
     statusCode: 200,
     body: JSON.stringify({
       message: "Event processed"
     }),
   };
   
   callback(null, response);
  
  }
  
};

//Functions to notify slack channel

const sendCommitToSlack = (commit) => {
  const text = [ `New COMMIT event`,
  `Author: *${commit.sender_name}* (UserID: ${commit.sender_id} with ${commit.n_commits} commits)`,
  `Repo: *${commit.repo_name}* (RepoID: ${commit.repo_id})`,
  `Message: _${commit.message}_`,
  `Creation time: _${commit.timestamp}_`,
  `Files added: ${commit.added} / Files modified: ${commit.modified} / Files removed: ${commit.removed}`
  ].join('\n');
  const resp = request('POST', WEBHOOK_URL, {json: { text }});
  // Use getBody to check if there was an error.
  resp.getBody();
}

const sendPRToSlack = (pull_request_obj) => {
  const text = [ `New PULL REQUEST event`,
  `Author: *${pull_request_obj.username}* (UserID: ${pull_request_obj.userid} with ${pull_request_obj.n_pr} PRs)`,
  `Title: _${pull_request_obj.title}_`,
  `Description: _${pull_request_obj.description}_`,
  `Repo: *${pull_request_obj.repo_name}* (RepoID: ${pull_request_obj.repo_id})`,
  `Creation time: _${pull_request_obj.creation_timestamp}_ / Update time: _${pull_request_obj.update_timestamp}_ / Merge time: _${pull_request_obj.merge_timestamp}_ / Close time: _${pull_request_obj.close_timestamp}_ ` 
  ].join('\n');
  const resp = request('POST', WEBHOOK_URL, {json: { text }});
  // Use getBody to check if there was an error.
  resp.getBody();
}

const sendIssueCommentToSlack = (issue_comment) => {
  const text = [ `New ISSUE COMMENT event`,
  `Author: *${issue_comment.username}* (UserID: ${issue_comment.userid})`,
  `Repo: *${issue_comment.repo_name}* (RepoID: ${issue_comment.repo_id})`,
  `Issue: ${issue_comment.issue_title}`,
  `Content: _${issue_comment.content}_`,
  `Creation time: _${issue_comment.creation_timestamp}_ / Update time: _${issue_comment.update_timestamp}_`
  ].join('\n');
  const resp = request('POST', WEBHOOK_URL, {json: { text }});
  // Use getBody to check if there was an error.
  resp.getBody();
}

const sendPRReviewToSlack = (pr_review) => {
  const text = [ `New PULL REQUEST REVIEW event`,
  `Author: *${pr_review.username}* (UserID: ${pr_review.userid})`,
  `Repo: *${pr_review.repo_name}* (RepoID: ${pr_review.repo_id})`,
  `Pull Request: ${pr_review.pr_title} (ID: ${pr_review.pr_id} / Number: ${pr_review.pr_number})`,
  `Submission time: _${pr_review.submission_timestamp}_ `
  ].join('\n');
  const resp = request('POST', WEBHOOK_URL, {json: { text }});
  // Use getBody to check if there was an error.
  resp.getBody();
}

const sendCommitCommentToSlack = (commit_comment) => {
  const text = [ `New COMMIT COMMENT event`,
  `Author: *${commit_comment.username}* (UserID: ${commit_comment.userid})`,
  `Repo: *${commit_comment.repo_name}* (RepoID: ${commit_comment.repo_id})`,
  `Content: _${commit_comment.content}_`,
  `Creation time: _${commit_comment.creation_timestamp}_ / Update time: _${commit_comment.update_timestamp}_`
  ].join('\n');
  const resp = request('POST', WEBHOOK_URL, {json: { text }});
  // Use getBody to check if there was an error.
  resp.getBody();
}

const sendPRReviewCommentToSlack = (pull_request_review_comment) => {
  const text = [ `New PULL REQUEST REVIEW COMMENT event`,
  `Author: *${pull_request_review_comment.username}* (UserID: ${pull_request_review_comment.userid})`,
  `Repo: *${pull_request_review_comment.repo_name}* (RepoID: ${pull_request_review_comment.repo_id})`,
  `Pull Request: ${pull_request_review_comment.pr_title} (ID: ${pull_request_review_comment.pr_id} / Number: ${pull_request_review_comment.pr_number})`,
  `Content: _${pull_request_review_comment.content}_`,
  `Creation time: _${pull_request_review_comment.creation_timestamp}_ / Update time: _${pull_request_review_comment.update_timestamp}_`
  ].join('\n');
  const resp = request('POST', WEBHOOK_URL, {json: { text }});
  // Use getBody to check if there was an error.
  resp.getBody();
}


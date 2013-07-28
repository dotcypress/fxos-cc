define(['app', 'lodash'], function(app, _) {
  app.factory('database', ['extensions', function(extensions) {

    var DB = function() {
      var self = this;
      var tasks = new PouchDB('tasksv');
      var projects = new PouchDB('projects');
      var contexts = new PouchDB('contexts');
      var meta = new PouchDB('meta');

      this.buildPredefined = function(){
        meta.get(0, function (err, doc) {
          if(!(err && err.status == 404)){
            return;
          }
          meta.put({_id: 0});
          //TODO: use async
          self.saveProject({_id: '200', name: 'Bussines', memo: 'Business Projects'});
          self.saveProject({_id: '201', name: 'Personal', memo: 'Family related, self improvement and all other personal projects'});

          self.saveContext({_id: '300', name: '@home'});
          self.saveContext({_id: '301', name: '@office'});
          self.saveContext({_id: '302', name: 'In the morning'});
          self.saveContext({_id: '303', name: '@garage'});
          self.saveContext({_id: '304', name: 'If got some free time'});
          self.saveContext({_id: '305', name: 'Online'});

          self.saveTask({_id: '400', name: 'Follow Tarasov Mobile on twitter: @TarasovMobile', startDate: null, dueDate: new Date(), contextId: '305', projectId: '201'});
          self.saveTask({_id: '401', name: 'Check out the Chaos Control web-page: www.chaos-control.mobi', startDate: null, dueDate: new Date(), contextId: '305', projectId: '201'});
          self.saveTask({_id: '402', name: 'Join us at Facebook: http://facebook.com/TarasovMobile', startDate: null, dueDate: new Date(), contextId: '305', projectId: '201'});
          self.saveTask({_id: '403', name: 'Order "Getting Things Done" book by David Allen', startDate: null, dueDate: null, contextId: '304', projectId: '200'});
        });
      };

      this.getDueTasks = function(cb) {
        tasks.allDocs({include_docs: true}, function(err, doc) {
          var all =  _.pluck(doc.rows, 'doc');
          var due = _.filter(all, function(task){
            var status = extensions.getTaskStatus(task);
            return status === extensions.due_today || status === extensions.overdue;
          });
          return cb(null, _.sortBy(due, function (task) {
            return extensions.getTaskWeight(task);
          }));
        });
      };

      this.getProjectTasks = function(projectId, cb) {
        tasks.allDocs({include_docs: true}, function(err, doc) {
          var all = _.pluck(doc.rows, 'doc');
          var filtered = _.where(all , {'projectId' : projectId});
          return cb(null, _.sortBy(filtered, function (task) {
            return extensions.getTaskWeight(task);
          }));
        });
      };

      this.getContextTasks = function(contextId, cb) {
        tasks.allDocs({include_docs: true}, function(err, doc) {
          var all = _.pluck(doc.rows, 'doc');
          var filtered = _.where(all , {'contextId' : contextId});
          return cb(null, _.sortBy(filtered, function (task) {
            return extensions.getTaskWeight(task);
          }));
        });
      };

      this.saveTask = function(task, cb) {
        tasks.put(task, cb);
      };

      this.deleteTask = function(task, cb) {
        tasks.remove(task, cb);
      };

      this.getTaskById = function(id, cb) {
        tasks.get(id, function(err, doc) {
          return cb(err, doc);
        });
      };

      this.getProjects = function(parentFolderId, cb) {
        projects.allDocs({include_docs: true}, function(err, doc) {
          var projects = _.pluck(doc.rows, 'doc');
          projects.unshift({_id: '1', name: 'Single tasks'});
          return cb(null, _.sortBy(projects, function (project) {
            return project.name.toLowerCase();
          }));
        });
      };

      this.saveProject = function(project, cb) {
        projects.put(project, cb);
      };

      this.deleteProject = function(project, cb) {
        self.getProjectTasks(project._id, function(err, child){
          _.forEach(child, function (task) {
            //TODO: use async
            tasks.remove(task);
          });
         projects.remove(project, cb);
        });
      };

      this.getProjectById = function(id, cb) {
        projects.get(id, function(err, doc) {
          return cb(err, doc);
        });
      };

      this.getContexts = function(parentContextId, cb) {
        contexts.allDocs({include_docs: true}, function(err, doc) {
           return cb(null, _.sortBy(_.pluck(doc.rows, 'doc'), function (project) {
            return project.name.toLowerCase();
          }));
        });
      };

      this.saveContext = function(context, cb) {
        contexts.put(context, cb);
      };

      this.deleteContext = function(context, cb) {
        self.getContextTasks(context._id, function(err, child){
          _.forEach(child, function (task) {
            task.contextId = null;
            //TODO: use async
            tasks.put(task);
          });
          contexts.remove(context, cb);
        });
      };

      this.getContextById = function(id, cb) {
        contexts.get(id, function(err, doc) {
          return cb(err, doc);
        });
      };
    };
    return new DB();
  }]);
});

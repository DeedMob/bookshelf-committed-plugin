const _ = require('lodash');

// Committed Plugin
// Emits the 'committed' event on `update` or `insert` when the save transaction completes for all models
// Note model.previousAttributes doesnt work with this.
module.exports = function(Bookshelf) {
  const proto = Bookshelf.Model.prototype;
  const Model = Bookshelf.Model.extend({
    save: function(key, value, options) {
      let attrs;
      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (key == null || typeof key === 'object') {
        attrs = key || {};
        options = _.clone(value) || {};
      } else {
        (attrs = {})[key] = value;
        options = options ? _.clone(options) : {};
      }
      options.method = this.saveMethod(options);
      const previousAttributes = _.clone(this.attributes) || {};

      const save = proto.save.call(this, key, value, options);
      if(options.method === 'insert' || options.method === 'update'){
        if (options.transacting) {
          options.transacting.__subscribers.push(() => {
            this.triggerThen('committed', this, attrs, options, previousAttributes);
          });
        } else {
          save.tap(model => model.triggerThen('committed', model, attrs, options, previousAttributes));
        }
      }

      return save;
    },
  });
  Bookshelf.transaction = function(originalContainer) {
    const modelsToCommit = [];
    let t;
    const container = transactor => {
      transactor.__subscribers = [];
      t = transactor;
      return originalContainer(transactor);
    };
    const args = Array.from(arguments);
    const d = Bookshelf.knex.transaction.apply(this, [container, ...args.slice(1)])

    d.then(() => {
      t.__subscribers.forEach(subscriber => subscriber());
    });
    return d;
  };

  Bookshelf.Model = Model;
};

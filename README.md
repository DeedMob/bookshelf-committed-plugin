# bookshelf-committed-plugin

A plugin for Bookshelf ORM to fire the `committed` event on `saved` and transaction completed successfully.

`saved`: `insert` or `update`

## Use case

The bookshelf `created`, `saved`, `updated` events actually fire before the transaction completes. So if you're using a transaction, and you try to load the model or related models in the `on` handler, the models wont be loaded.

## Example and definition

```
initialize(){
  this.on('committed', (model, attrs, options, previousAttributes) => {
    // do something
  });
}
```

```
model: Bookshelf.Model,
attrs: Object, // plain object of attributes that will be updated
options: Object, // options passed to save, including method which is automatically added if not originally in save options
previousAttributes: Object, // plain object of attributes prior to this save, (not neccessarily the same as prior to the transaction)

## FAQ

- If I do a save on a model twice in the same transaction, will `committed` event be fired twice?
Yes

- Why did you include previousAttributes when bookshelf supports this via model.previousAttributes() and other bookshelf event handlers don't have this parameter?
Bookshelf's `previousAttributes()` is unreliable because its conceivable that the value gets overwritten by another `save`, before we retrieve the value in the `on` handler of the other `save`. Additionally with the case of multiple `save`s on the same model in the same transaction, the first `previousAttributes` will be overwritten by the time the `committed` events get called. Additionally it makes more sense to me to call the event handler with this value as an additional argument rather than storing it in the model itself, as its only relevant immediately post `save`.

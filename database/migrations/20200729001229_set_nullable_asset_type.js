exports.up = function (knex, Promise) {
    return knex.schema.alterTable("asset_type", function (t) {
        t.string('description')
        t.string('asset_type_code').nullable().alter();
        t.string('asset_type_name').nullable().alter();
        t.string('description').nullable().alter();
    });
};

exports.down = function (knex) {

};

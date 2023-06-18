exports.up = function (knex, Promise) {
    return knex.schema.alterTable("asset", function (t) {
        t.dropColumn('asset_info_vn')
        t.string('asset_code').nullable().alter();
        t.string('asset_info').nullable().alter();
        t.string('note').nullable().alter();
        t.string('status').nullable().alter();
    });
};

exports.down = function (knex) {

};

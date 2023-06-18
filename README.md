# Jira QCD API

> Knowledge: [knex](http://knexjs.org/), [postgres 9.4+](https://www.postgresql.org/docs/9.4/index.html)

## Config project

> See at environments directory, to use variable environment change to .env
> At first build, execute all file in database directory or copy-paste to SQL query tool

> If you have `npm error invalid semver` [see here](https://stackoverflow.com/questions/19422949/npm-error-invalid-semver)

## Build Setup

```bash
# install dependencies
$ yarn install

# Before run/deploy run knex command for database
$ yarn knex-it # for deploy
$ yarn knex-dev # for development
$ yarn knex-seed #This command necessary from second time

# serve with hot reload at localhost:8080
$ yarn dev
```

## Authorize

Project using `express-jwt-permissions` package for authorize with multiple role

## Reference

> [knex](http://knexjs.org/)

> [postgres](https://www.postgresql.org/docs/)

> [bcrypt](https://www.npmjs.com/package/bcrypt)

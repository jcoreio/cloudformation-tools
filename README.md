# JCore CloudFormation Tools

Tools for generating CloudFormation templates and deploying CloudFormation stacks

## Installation

`npm install --save @jcoreio/cloudformation-tools`

or

`yarn add @jcoreio/cloudformation-tools`

## Usage

```js
const {deployCloudFormationStack} = require('@jcoreio/cloudformation-tools')

await deployCloudFormationStack({
    stackName: 'MyStack',
    templateFile: path.resolve(__dirname, 'cloudformation.yml'),
  })
```

## License

 [Apache-2.0](LICENSE)
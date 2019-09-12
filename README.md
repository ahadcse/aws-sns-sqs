#### AWS SNS SQS

Send an event to a lambda launcher. Then that launcher will trigger another lambda which put things to 
SNS. A SQS is subscribed to it. which will be populated as soons as there is a message to SNS.


### Deployment:

1. make deploy_sns
2. make deploy_sqs
3. make validate_config
4. make deploy_config
5. make deploy_serverless

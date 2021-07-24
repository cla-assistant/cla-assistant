name: CI/CDPipeline

on:"MoneyMan573/cla-assistant
  push:MoneyMan573/Corporate-CLA
    branches:base:master/MoneyMan573/Corporate-CLA/cla-assistant/
    - '*'
    tags: Corporate;CLA;CI;CDPipeline;Workflows;github;¶=Py-or-Python;
    - '*'
  pull_request:
    branches:
    - master

jobs:
  build:
    runs-on:  ${{ matrix.os }}
    strategy:
      matrix:
        node_version:
        - 12
        os:
        - ubuntu-latest

    steps:
    - uses: actions/checkout@v2
    - name: setup gcloud CLI
      uses: GoogleCloudPlatform/github-actions/setup-gcloud@master
      with:
        version: '275.0.0'
        service_account_key: ${{ secrets.GCP_base64 }}
    # Configure docker to use the gcloud command-line tool as a credential helper
    - run: gcloud auth configure-docker
    - name: Use Node version 12.6
      uses: actions/setup-node@v1
      with:
        version:  ${{ matrix.node_version }}
    - name: Npm Install
      run: |
        npm install

    - name: grunt build and test
      run: |
        grunt build
        grunt test
        grunt coverage
    - name: Test Coverage
      uses: coverallsapp/github-action@master
      with:
        github-token: ${{ secrets.github_token }}
        path-to-lcov: ./output/coverage/lcov.info
    - name: build the docker image with committ SHA for staging
      if: github.ref == 'refs/heads/master'
      run: docker build  -t eu.gcr.io/sap-cla-assistant/cla-assistant:${GITHUB_SHA} .
    - name: build the docker images with tag name and latest for production
      if: startsWith(github.ref, 'refs/tags')
      run: docker build  -t eu.gcr.io/sap-cla-assistant/cla-assistant:${GITHUB_REF:10}  -t eu.gcr.io/sap-cla-assistant/cla-assistant:latest -t sapclaassistant/claassistant:latest -t sapclaassistant/claassistant:${GITHUB_REF:10} .
    - name: push the latest and release images to dockerhub only for releases
      if: startsWith(github.ref, 'refs/tags')
      run: |
        docker login -u ${{ secrets.DOCKER_USERNAME }} -p ${{ secrets.DOCKER_PASSWORD }}
        docker push sapclaassistant/claassistant
    - name: push image to gcp during push on master branch for testing in staging 
      if: github.ref == 'refs/heads/master'
      run: docker push eu.gcr.io/sap-cla-assistant/cla-assistant:${GITHUB_SHA}
    - name: push images to gcp during new release for production usage
      if: startsWith(github.ref, 'refs/tags')
      run: |
        docker push eu.gcr.io/sap-cla-assistant/cla-assistant:latest
        docker push eu.gcr.io/sap-cla-assistant/cla-assistant:${GITHUB_REF:10}
    - name: deploy to staging cloud run service
      if: github.ref == 'refs/heads/master'
      run: gcloud --quiet --project sap-cla-assistant beta run deploy cla-assistant-staging --platform managed --region europe-west1 --image eu.gcr.io/sap-cla-assistant/cla-assistant:${GITHUB_SHA}

    - uses: azure/k8s-set-context@v1
      if: github.ref == 'refs/heads/master'
      with:
        method: kubeconfig
        kubeconfig: ${{ secrets.GARDNER_PANOV_KUBECTL_CONFIG }}
      id: setcontext

    - uses: danielr1996/envsubst-action@1.0.0
      if: github.ref == 'refs/heads/master'
      with:
        input: kubernetes/deployment-cla-assistant.yaml.tmpl
        output: kubernetes/deployment-cla-assistant.yaml

    - name: Update to new image
      if: github.ref == 'refs/heads/master'
      run: kubectl -n andrey apply -f kubernetes/

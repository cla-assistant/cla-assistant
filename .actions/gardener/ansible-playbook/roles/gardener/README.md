# K8s role information

This Ansible role allow you to deploy necessary resources to create your gardener cluster.

## How to use

- Add your own override values in the `group_vars` folder and add the path to your playbook.
- Call this role in your ansible playbook.
- Make sure you are using the `iam_users` role.

## Things to know

- Make sure that theres no Service account already created.
- Make sure to delete the `SecretBinding` if you want to run the full playbook.
- `gardener_kubeconfig_path` represent the path of your KUBECONFIG.
- `gardener_kubeconfig_raw` represent the raw valuesof a KUBECONFIG. If this values is not empty it will be paste in the file located at the `gardener_kubeconfig_path`

## Running the role with the --check and --diff flag

In order to avoid error and use the `--check` and `--diff` flag on this role. You need to :
- Comment the `gardener_kubeconfig_raw` variable in your `group_vars`
- Comment the `gardener_kubeconfig_raw` variable in the default main values of this role.
- Copy your kubeconfig at the root of the `aws-setup-playbook` folder
- Change the value of `gardener_kubeconfig_path` variable in your `group_vars` to point to that newly copied kubeconfig. (ex.: `gardener_kubeconfig_path: gardener-test-kubeconfig.yaml`)
- Run your playbook with the --check and --diff flag

## How to delete the cluster

1. In your group_vars set: `gardener_shoot_allow_delete: true`
2. Set the shoot resource state to `gardener_shoot_state: present`
3. Run the playbook to add the annotation.
4. In your group_vars set: `gardener_shoot_state` to `absent`
5. Run the playbook to delete the shoot.

### Optional resources to delete
- To remove the gardener secret, in your group_vars set: `gardener_secret_state` to `absent`
- To remove the gardener auditpolicy, in your group_vars set: `gardener_auditpolicy_state` to `absent`
- To remove the AWS iam user, in your playbook set: `iam_users.user_state` to  `absent`

## More

- You can use `cla_assistant_stage-us-east-1.yaml` playbook as reference.


#!/bin/sh -l

echo "----------START PLAYBOOK EXECUTION----------"
echo ansible-playbook "${INPUT_PLAYBOOKNAME}" -i "${INPUT_INVENTORYFILE}" "${INPUT_EXTRAVARS}" "${INPUT_VERBOSITY}"
ansible-playbook "${INPUT_PLAYBOOKNAME}" -i "${INPUT_INVENTORYFILE}" "${INPUT_EXTRAVARS}" "${INPUT_VERBOSITY}"
echo "----------END OF PLAYBOOK EXECUTION----------"

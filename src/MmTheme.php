<?php declare(strict_types=1);

namespace MmTheme;

use Shopware\Core\Framework\Plugin;
use Shopware\Storefront\Framework\ThemeInterface;

use Shopware\Core\Framework\Plugin\Context\ActivateContext;
use Shopware\Core\Framework\Plugin\Context\DeactivateContext;
use Shopware\Core\Framework\Plugin\Context\InstallContext;
use Shopware\Core\Framework\Plugin\Context\UninstallContext;
use Shopware\Core\Framework\Plugin\Context\UpdateContext;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\System\CustomField\CustomFieldTypes;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsAnyFilter;

class MmTheme extends Plugin implements ThemeInterface
{
    public function getThemeConfigPath(): string
    {
        return 'theme.json';
    }

    private $groups = [
        'mm_footer',
    ];

    private $fields = [
        [
            'name' => 'mm_footer',
            'global' => true,
            'config' => [
                'label' => [
                    'en-GB' => 'Footer Options'
                ]
            ],
            'relations' => [[
                'entityName' => 'sales_channel'
            ]],
            'customFields' => [
                [
                    'name' => 'mmtheme_payment_logos',
                    'type' => CustomFieldTypes::HTML,
                    'config' => [
                        'label' => [
                            'en-GB' => 'Payment Logos'
                        ],
                        'componentName' => 'sw-text-editor',
                        'customFieldType' => 'textEditor',
                        'customFieldPosition' => 0,
                    ]
                ],
                [
                    'name' => 'mmtheme_delivery_logos',
                    'type' => CustomFieldTypes::HTML,
                    'config' => [
                        'label' => [
                            'en-GB' => 'Delivery Logos'
                        ],
                        'componentName' => 'sw-text-editor',
                        'customFieldType' => 'textEditor',
                        'customFieldPosition' => 0,
                    ]
                ],
                [
                    'name' => 'mmtheme_trust_badges',
                    'type' => CustomFieldTypes::HTML,
                    'config' => [
                        'label' => [
                            'en-GB' => 'Trust Badges'
                        ],
                        'componentName' => 'sw-text-editor',
                        'customFieldType' => 'textEditor',
                        'customFieldPosition' => 0,
                    ]
                ],
            ]
        ]
    ];

    private function removeFields($context): void
    {
        /** @var EntityRepositoryInterface $customFieldSetRepository */
        $customFieldSetRepository = $this->container->get('custom_field_set.repository');

        $criteria = (new Criteria())->addFilter(new EqualsAnyFilter('name', $this->groups));
        $results = $customFieldSetRepository->search($criteria, $context->getContext())->getEntities();

        $ids = [];

        foreach ($results as $result) {
            $id = [ 'id' => $result->get('id') ];

            array_push($ids, $id);
        }

        $customFieldSetRepository->delete($ids, $context->getContext());
    }

    private function addFields($context): void
    {
        /** @var EntityRepositoryInterface $customFieldSetRepository */
        $customFieldSetRepository = $this->container->get('custom_field_set.repository');

        $customFieldsGroups = $this->getAllCustomFieldsGroups();
        $addedCustomFieldsGroups = [];
        foreach ($customFieldsGroups as $group) {
            if (!$this->customFieldGroupIsExist($group['name'], $context)) {
                array_push($addedCustomFieldsGroups, $group);
            }
        }

        if ($addedCustomFieldsGroups) {
            $customFieldSetRepository->create($addedCustomFieldsGroups, $context->getContext());
        }
    }

    public function activate(ActivateContext $context): void
    {
        $this->addFields($context);

        parent::activate($context);
    }

    public function update(UpdateContext $context): void
    {
        $this->removeFields($context);
        $this->addFields($context);

        parent::update($context);
    }

    public function deactivate(DeactivateContext $context): void
    {
        $this->removeFields($context);

        parent::deactivate($context);
    }

    public function uninstall(UninstallContext $context): void
    {
        $this->removeFields($context);

        parent::uninstall($context);
    }

    private function customFieldGroupIsExist(string $name, $context) {
        $customFieldSetRepository = $this->container->get('custom_field_set.repository');
        $criteria = (new Criteria())->addFilter(new EqualsFilter('name', $name));
        $results = $customFieldSetRepository->search($criteria, $context->getContext())->getEntities()->first();

        return $results;
    }

    private function getAllCustomFieldsGroups() {
        return $this->fields;
    }
}
